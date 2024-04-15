const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db server ${e.message}`);
    process.exit(1);
  }
};

initializeDbServer();

//Priority and status
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//Get API for priority and status
app.get("/todos", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getQuery = "";

  switch (true) {
    case hasStatus(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
      break;

    case hasPriority(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
      break;

    case hasPriorityAndStatus(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'
        AND priority = '${priority}';`;
      break;

    default:
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }

  const getResponse = await db.all(getQuery);
  response.send(getResponse);
});

//Get specific todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `select * from todo where id = ${todoId};`;
  const todoResponse = await db.get(getTodo);
  response.send(todoResponse);
});

//Update todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  console.log(request.body);
  const createQuery = `insert into todo (id, todo, priority, status) 
    values (${id}, '${todo}', '${priority}', '${status}');`;
  const QueryResponse = await db.run(createQuery);
  response.send("Todo Successfully Added");
});

//Update todo based on columns
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let getColumn = "";

  switch (true) {
    case request.body.status !== undefined:
      getColumn = "Status";
      break;

    case request.body.priority !== undefined:
      getColumn = "Priority";
      break;

    case request.body.todo !== undefined:
      getColumn = "Todo";
      break;
  }

  const previousTodoQuery = `select * from todo where id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodo = `update todo set todo = '${todo}', priority = '${priority}',
  status = '${status}' where id = ${todoId};`;

  await db.run(updateTodo);
  response.send(`${getColumn} Updated`);
});

//Delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
