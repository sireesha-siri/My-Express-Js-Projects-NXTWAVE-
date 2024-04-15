const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const InitializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Server ${e.message}`);
    process.exit(1);
  }
};

InitializeDbServer();

//changing from snake_case to camelCase
const convertDbObjectForMovie = (objectItem) => {
  return {
    movieId: objectItem.movie_id,
    directorId: objectItem.director_id,
    movieName: objectItem.movie_name,
    leadActor: objectItem.lead_actor,
  };
};

//Get all movies
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `select movie_name from movie`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectForMovie(eachMovie))
  );
});

//Add movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const createAddMovieQuery = `insert into movie(director_id, movie_name, lead_actor)
    values(${directorId}, '${movieName}', '${leadActor}');`;
  const dbResponse = await db.run(createAddMovieQuery);
  response.send("Movie Successfully Added");
});

//Get a movie
app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `select * from movie where movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectForMovie(movie));
});

//Update movie
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `update movie set director_id = ${directorId}, 
    movie_name = '${movieName}', lead_actor = '${leadActor}' where movie_id = ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//Delete a movie
app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `delete from movie where movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//changing from snake_case to camelCase
const convertDbObjectForDirector = (objectItem) => {
  return {
    directorId: objectItem.director_id,
    directorName: objectItem.director_name,
  };
};

//Get all directors
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `select * from director`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDbObjectForDirector(eachDirector)
    )
  );
});

//Get all movies directed by a director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieOfTheDirectorQuery = `select movie_name from movie where director_id = ${directorId};`;
  const moviesArray = await db.all(getMovieOfTheDirectorQuery);
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectForMovie(eachMovie))
  );
});

module.exports = app;
