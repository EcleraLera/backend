// const express = require('express');
// const jsonServer = require('json-server');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');

// const server = express();
// const router = jsonServer.router('db.json');
// const middlewares = jsonServer.defaults();

// server.use(express.json());
// server.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// // Кастомные маршруты
// server.post('/registration', (req, res) => {
//   const newUser = { ...req.body, id: Math.random().toString(36).substring(2, 9) };
//   const dbPath = path.resolve(__dirname, 'db.json');
//   const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
//   db.users.push(newUser);
//   fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
//   res.cookie('doggee-auth', '123456', { httpOnly: true, sameSite: 'strict' });
//   res.status(201).json({ success: true, data: newUser });
// });

// server.get('/registration', (req, res) => {
//   const dbPath = path.resolve(__dirname, 'db.json');
//   const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
//   res.json({ success: true, data: db.users });
// });

// server.use('/api', router);

// server.listen(3001, () => {
//   console.log(`Server is running on http://localhost:3001`);
// });

const express = require('express');
const jsonServer = require('json-server');
const db = require('./db.json');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router(db, { foreignKeySuffix: 'id' });
const middlewares = jsonServer.defaults();

server.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

server.use(cors(corsOptions));
server.options('*', cors(corsOptions));

server.use(
  jsonServer.rewriter({
    '/registration': '/users',
  }),
);

server.post('/registration', function (req, res, next) {
  req.body.id = Math.random();
  res.cookie('doggee-auth', '123456', {
    httpOnly: true,
    sameSite: 'strict',
  });
  next();
});

server.post('/auth', function (req, res) {
  const { body } = req;
  const user = db.users.find(
    (user) => user.password === body.password && user.username === body.username,
  );

  if (!user) {
    res.status(404).send({ success: false, data: { message: 'User does not exist' } });
    return;
  }

  res.cookie('doggee-auth-token', '123456', {
    // httpOnly: false,
    sameSite: 'Strict', // Use 'Lax' if you experience issues with Strict
    secure: false, // Set to true if using HTTPS
  });

  console.log('Cookie set:', 'doggee-auth-token', '123456');
  res.send({ success: true, data: user });
});

// Ваш обработчик GET запроса на /auth
server.get('/auth', function (req, res) {
  console.log('GET /auth endpoint hit');
  res.send({ success: true, data: db.users });
});

server.use(middlewares);

// Подключение маршрутов json-server после ваших кастомных маршрутов
server.use(router);

// Добавление общего обработчика ошибок
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Логирование всех зарегистрированных маршрутов
server._router.stack.forEach(function (r) {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

const port = 3001;
server.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
