const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbServer();

//Convert state table from snake_case to camelCase
const convertStateTable = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

const convertDistrictTable = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};

//Get states
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  //response.send(statesArray);
  response.send(statesArray.map((eachState) => convertStateTable(eachState)));
});

//Get state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateTable(state));
});

//Add district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `insert into district (district_name, state_id, cases, cured, active, deaths)
    values ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Get district
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `select * from district where district_id = ${districtId};`;
  const district = await db.get(getDistrict);
  response.send(convertDistrictTable(district));
});

//Delete district
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const removeDistrict = `delete from district where district_id = ${districtId};`;
  await db.get(removeDistrict);
  response.send("District Removed");
});

//Update district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set district_name = '${districtName}', 
  state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths}
  where district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
     sum(active) as totalActive, sum(deaths) as totalDeaths from district where state_id = ${stateId};`;
  const statistics = await db.get(getQuery);
  response.send(statistics);
});

//Get state name
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
