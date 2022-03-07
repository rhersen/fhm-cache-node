# fhm-cache-node
```mermaid
sequenceDiagram
    participant app
    participant cache
    participant fhm
    app->>cache: get today's data
    cache->>fhm: get today's excel sheet
```
