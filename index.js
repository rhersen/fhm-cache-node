import http from "http";
import axios from "axios";
import xlsx from "xlsx";
import _ from "lodash";
import { format, isValid, parse } from "date-fns";

const requestListener = async function (req, res) {
  console.log(req.method, req.url);
  if (req.url === "/") {
    const { data, status, statusText } = await axios.get(
      "https://www.arcgis.com/sharing/rest/content/items/b5e7488e117749c19881cce45db13f7e/data",
      {
        responseType: "arraybuffer",
      }
    );
    console.log(status, statusText, data.length, "bytes");
    const book = xlsx.read(data);

    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(cases(book)));
  } else {
    res.writeHead(404);
    res.end();
  }
};

const server = http.createServer(requestListener);
server.listen(8080);

function cases({ Sheets }) {
  const sheet = Sheets?.["Antal per dag region"];
  if (!sheet) return {};

  const entries = Object.entries(sheet);

  const rows = _.groupBy(
    _.reject(entries, ([k]) => _.startsWith(k, "!")),
    ([k]) => k.substr(1)
  );

  return {
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
