const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//get allstates api
app.get('/states/', async (request, response) => {
  const getStatesQuery = `SELECT
    * FROM state;`
  const statesArray = await db.all(getStatesQuery)
  const convertdbObjToOutputObj = dbObj => {
    return {
      stateId: dbObj.state_id,
      stateName: dbObj.state_name,
      population: dbObj.population,
    }
  }

  response.send(
    statesArray.map(eachState => convertdbObjToOutputObj(eachState)),
  )
})

//getspecific_state api
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `SELECT *
  FROM state
  WHERE state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  const modState = {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  }
  response.send(modState)
})

//post api
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
  VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths});`
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

//getspecific_district api
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `SELECT * FROM district
  WHERE district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  const modDistrict = {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  }
  response.send(modDistrict)
})

//delete api
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `DELETE FROM district
  WHERE district_id = ${districtId};`

  await db.run(deleteQuery)
  response.send('District Removed')
})

//update specificDistrict api
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateQuery = `UPDATE district
  SET district_name = "${districtName}",
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};`
  await db.run(updateQuery)
  response.send('District Details Updated')
})

//get statistics api
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatisticsQuery = `SELECT 
  SUM(cases) AS totalCases, SUM(cured) AS totalCured,SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths FROM district
  WHERE state_id = ${stateId};`
  const statistics = await db.get(getStatisticsQuery)
  response.send(statistics)
})

//stateName api
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `SELECT state_name AS stateName
  FROM state INNER JOIN district on state.state_id = district.state_id
  WHERE district_id = ${districtId};`

  const stateName = await db.get(getStateNameQuery)
  response.send(stateName)
})

module.exports = app
