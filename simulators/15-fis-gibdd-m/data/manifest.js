FISDATA.manifest({
 "generated": "2026-10-16",
 "seed": 20261014,
 "scale": 1.0,
 "sets": {
  "persons": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "issueDate": "date"
   },
   "lazy": false
  },
  "vehicles": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "id": "int",
    "year": "int",
    "regDate": "date",
    "anomaly": "nullstr"
   },
   "lazy": false
  },
  "licenses": {
   "rows": 8000,
   "shards": 2,
   "types": {
    "id": "int",
    "cats": "list",
    "issueDate": "date",
    "expDate": "date",
    "revokeEnd": "date",
    "revokeDays": "int"
   },
   "lazy": false
  },
  "exams": {
   "rows": 1243,
   "shards": 1,
   "types": {
    "date": "date",
    "allPass": "bool"
   },
   "lazy": false
  },
  "violations": {
   "rows": 20000,
   "shards": 5,
   "types": {
    "id": "int",
    "amount": "int",
    "paid": "bool",
    "paidAmt": "num",
    "vDate": "date",
    "deadline": "date",
    "payDate": "date"
   },
   "lazy": false
  },
  "wanted": {
   "rows": 250,
   "shards": 1,
   "types": {
    "active": "bool",
    "date": "date",
    "clearDate": "date"
   },
   "lazy": false
  },
  "special": {
   "rows": 5,
   "shards": 1,
   "types": {
    "total": "int",
    "used": "int",
    "lost": "int"
   },
   "lazy": false
  },
  "specmoves": {
   "rows": 220,
   "shards": 1,
   "types": {
    "date": "date",
    "qty": "int"
   },
   "lazy": false
  },
  "fssp": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "amount": "int",
    "start": "date",
    "restrict": "bool"
   },
   "lazy": true
  },
  "fns": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "debtTransport": "int",
    "debtProperty": "int",
    "debtIncome": "int",
    "updated": "date"
   },
   "lazy": true
  },
  "fts": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "year": "int",
    "date": "date",
    "dutyPaid": "bool",
    "until": "date"
   },
   "lazy": true
  },
  "interpol": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "year": "int",
    "theftDate": "date"
   },
   "lazy": true
  },
  "eaisto": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "issued": "date",
    "until": "date",
    "odometer": "int"
   },
   "lazy": true
  },
  "rosavtodor": {
   "rows": 10000,
   "shards": 3,
   "types": {
    "date": "date",
    "axles": "int",
    "weightActual": "num",
    "weightAllowed": "num",
    "excess": "num",
    "fine": "int",
    "paid": "bool"
   },
   "lazy": true
  }
 }
});
