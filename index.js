import http from "http";
import axios from "axios";
import xlsx from "xlsx";
import _ from "lodash";
import { addHours, differenceInHours, format, isValid, parse } from "date-fns";

const port = 8080;
let cache = {};

const server = http.createServer(async (req, res) => {
  console.log(req.method, req.url);
  if (req.url === "/") {
    const ageInHours = differenceInHours(Date.now(), cache.timestamp);
    console.log(`data is ${ageInHours} hours old`);
    const isCacheValid = ageInHours < 24;
    console.log(`cache is ${isCacheValid ? "valid" : "invalid"}`);
    if (!isCacheValid) {
      const { data, status, statusText } = await axios.get(
        "https://www.arcgis.com/sharing/rest/content/items/b5e7488e117749c19881cce45db13f7e/data",
        {
          responseType: "arraybuffer",
        }
      );
      console.log(status, statusText, data.length, "bytes");
      const book = xlsx.read(data);
      const day = _.last(_.keys(book.Sheets));
      const timestamp = addHours(
        parse(day.substr(4).trim(), "d MMM yyyy", new Date()),
        14
      );
      console.log("data from", day);

      cache = { data: cases(book), timestamp };
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(cache.data));
  } else {
    res.writeHead(404);
    res.end();
  }
});

console.log(`listening on http://localhost:${port}`);
server.listen(port);

function cases({ Sheets }) {
  const sheet = Sheets?.["Antal per dag region"];
  if (!sheet) return {};

  const entries = Object.entries(sheet);

  const rows = _.groupBy(
    _.reject(entries, ([k]) => _.startsWith(k, "!")),
    ([k]) => k.substr(1)
  );

  return {
    heading: _.last(_.keys(Sheets)),
    columns: _.map(
      _.filter(entries, ([cell]) => /^[^A]1$/.test(cell)),
      ([, value]) => value.v
    ),
    rows: _.map(
      _.filter(
        _.filter(entries, ([cell]) => /^A\d+$/.test(cell)),
        ([cell]) => cell !== "A1"
      ),
      ([, value]) => iso(value.w)
    ),
    cells: _.tail(
      _.map(rows, (row) => _.map(_.tail(row), ([, value]) => value.v))
    ),
  };
}

function iso(date) {
  const parsed = parse(date, "M/d/yy", new Date());
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : date;
}
