const express = require('express');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multipartMiddleware = multipart();
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3128;

const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('appSecret', 'secretforinvoiceapp');

app.post('/register', multipartMiddleware, function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    let db = new sqlite3.Database("./database/InvoiceApp.db");
    let sql = `INSERT INTO users(name, email, company_name, password) VALUES ('${req.body.name}','${req.body.email}','${req.body.company_name}','${hash}')`;
    db.run(sql, function(err) {
      if (err) {
        throw err;
      } else {
        let user_id = this.lastID;
        let query = `SELECT * FROM users WHERE id='${user_id}'`;
        db.all(query, [], (err, rows) => {
          if (err) {
            throw err;
          }
          let user = rows[0];
          delete user.password;
          const payload = {
            user: user
          };
          let token = jwt.sign(payload, app.get('appSecret'), {
            expiresInMinutes: "24h"
          });
          return res.json({
            status: true,
            user: user,
            token : token
          });
        });
      }
    });
    db.close();
  });
});

app.post("/login", multipartMiddleware, function(req, res) {
  let db = new sqlite3.Database("./database/InvoiceApp.db");
  let sql = `SELECT * from users WHERE email='${req.body.email}'`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    db.close();
    if (rows.length === 0) {
      return res.json({
        status: false,
        message: "Sorry, wrong email"
      });
    }
    let user = rows[0];
    let authenticated = bcrypt.compareSync(req.body.password, user.password);
    delete user.password;
    if (authenticated) {
      const payload = { user: user };
      let token = jwt.sign(payload, app.get('appSecret'), {
        expiresIn: "24h"
      });
      return res.json({
        status: true,
        user: user,
        token: token
      });
    }
    return res.json({
      status: false,
      message: "Wrong Password, try again"
    });
  });
});

app.use(function(req, res, next) {
  let token = req.body.token || req.query.token || req.headers["x-access-token"];

  if (token) {
    jwt.verify(token, app.get('appSecret'), function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token"
        });
      } else {
        req.decoded = decoded;
        next()
      }
    });
  } else {
    return res.status(403).send({
      succes: false,
      message: "No token provided"
    });
  }
});

app.get('/', function(req, res) {
  res.send("Welcome to the Invoice App");
});

app.get("/invoice/user/:user_id", multipartMiddleware, function(req, res) {
  let db = new sqlite3.Database("./database/InvoiceApp.db");
  let sql = `SELECT * FROM invoices WHERE user_id='${req.params.user_id}'`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    return res.json({
      status: true,
      invoices: rows
    });
  });
});

app.get("/invoice/user/:user_id/:invoice_id", multipartMiddleware, function(req, res) {
  let db = new sqlite3.Database("./database/InvoiceApp.db");
  let sql = `SELECT * FROM invoices WHERE user_id='${req.params.user_id}' AND id='${req.params.invoice_id}'`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    let invoice = rows[0]
    let fetchInvoice = `SELECT * FROM transactions WHERE invoice_id='${req.params.invoice_id}'`
    db.all(fetchInvoice, [], (err, rows) => {
      if (err) {
        throw err;
      }
      return res.json({
        status: true,
        invoice: invoice,
        transactions: rows
      })
    });
  });
});

app.post("/invoice", multipartMiddleware, function(req, res) {
  let db = new sqlite3.Database("./database/InvoiceApp.db");
  let sql = `INSERT INTO invoices(name, user_id, paid) VALUES('${req.body.name}','${req.body.user_id}','${req.body.paid}')`;
  db.serialize(function() {
    db.run(sql, function(err) {
      if (err) {
        throw err;
      }
      let invoice_id = this.lastID;
      let query = `INSERT INTO transactions(item_id, description, quantity, price, total, invoice_id) VALUES('${req.body.item_id}','${req.body.description}','${req.body.quantity}','${req.body.price}',
      '${req.body.total}',${invoice_id})`;
      db.run(query);

      return res.json({
        status: true,
        message: "Invoice Created"
      });
    });
  });
});

app.listen(PORT, function() {
  console.log(`App running on localhost:${PORT}`);
});
