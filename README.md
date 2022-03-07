# fhm-cache-node
```mermaid
sequenceDiagram
    app->>cache: get today's data
    Note over cache: miss
    cache->>fhm: get today's excel sheet
    fhm->>cache: xlsx
    Note over cache: convert xlsx to json
    cache->>app: json
    app->>cache: get today's data
    Note over cache: hit
    cache->>app: json
```
