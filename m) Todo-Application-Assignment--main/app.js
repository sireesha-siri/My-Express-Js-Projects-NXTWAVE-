const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");

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

    app.listen(3000, () =>
      console.log("Server running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`Db Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbServer();

//snake to camel case
const changeToCamelCase = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    category: item.category,
    priority: item.priority,
    status: item.status,
    dueDate: item.due_date,
  };
};

//check cases
function hasStatus(status) {
  return status !== undefined;
}

function hasPriority(priority) {
  return priority !== undefined;
}

function hasPriorityAndStatus(priority, status) {
  return priority !== undefined && status !== undefined;
}

function hasCategoryAndStatus(category, status) {
  return category !== undefined && status !== undefined;
}

function hasCategory(category) {
  return category !== undefined;
}

function hasCategoryAndPriority(category, priority) {
  return category !== undefined && priority !== undefined;
}

function hasSearchProperty(search_q) {
  return search_q !== undefined;
}

//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let getTodoQuery = "";
  let getTodoArray = "";

  switch (true) {
    case hasStatus(status):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `select * from todo where status like '${status}'`;
        getTodoArray = await db.all(getTodoQuery);
        response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority(priority):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `select * from todo where priority like '${priority}'`;
        getTodoArray = await db.all(getTodoQuery);
        response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatus(priority, status):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where priority like '${priority}'
                and status like '${status}'`;
          getTodoArray = await db.all(getTodoQuery);
          response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(category, status):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where category like '${category}'
                and status like '${status}'`;
          getTodoArray = await db.all(getTodoQuery);
          response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategory(category):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `select * from todo where category like '${category}'`;
        getTodoArray = await db.all(getTodoQuery);
        response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(category, priority):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `select * from todo where category like '${category}'
                and priority like '${priority}'`;
          getTodoArray = await db.all(getTodoQuery);
          response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasSearchProperty(search_q):
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`;
      getTodoArray = await db.all(getTodoQuery);
      response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
      break;

    default:
      getTodoQuery = `select * from todo;`;
      getTodoArray = await db.all(getTodoQuery);
      response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
      break;
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId}`;
  const getTodo = await db.get(getTodoQuery);
  response.send(changeToCamelCase(getTodo));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const dueDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `select * from todo where due_date = '${dueDate}'`;
    const getTodoArray = await db.all(getTodoQuery);
    response.send(getTodoArray.map((todo) => changeToCamelCase(todo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createQuery = `insert into todo (id, todo, priority, status, category, due_date) 
              values (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDate}');`;
          const QueryResponse = await db.run(createQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const { todo, priority, status, category, dueDate } = request.body;

  let updateTodoQuery = "";

  switch (true) {
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `update todo SET todo ='${todo}', priority ='${priority}', 
                status ='${status}', category ='${category}', due_date ='${dueDate}' 
                where id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `update todo SET todo='${todo}', priority='${priority}', 
                status='${status}', category='${category}', due_date='${dueDate}' 
                where id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case todo !== undefined:
      updateTodoQuery = `update todo SET todo='${todo}', priority='${priority}', 
                status='${status}', category='${category}', due_date='${dueDate}' 
                where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `update todo SET todo='${todo}', priority='${priority}', 
                status='${status}', category='${category}', due_date='${dueDate}' 
                where id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `update todo SET todo='${todo}', priority='${priority}', 
                status='${status}', category='${category}', due_date='${newDate}' 
                where id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
