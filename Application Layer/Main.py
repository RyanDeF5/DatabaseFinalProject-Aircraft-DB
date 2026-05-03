from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Database import Database
from typing import Dict, Any

database = Database()

# Define update request body
class UpdateRequest(BaseModel):
    pk: str
    rowIndex: int
    columnName: str
    value: str

# Define update request body
class InsertRequestAFP(BaseModel):
    leg_id: str
    waypoint_id: int
    target_alt: str
    target_speed: str
    leg_type: str
    stats: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_headers=["*"],
    allow_methods=["*"],
)

@app.get("/statevector")
async def get_telemetry():
    results = database.get_state_vector(); 
    return {"payload": results}

@app.get("/navstate")
async def get_fault_logs():
    results = database.get_navstate(); 
    return {"payload": results}

@app.get("/faults")
async def get_fault_logs():
    results = database.get_faults(); 
    return {"payload": results}

@app.post("/table/{name}/InsertRow")
async def update_table(name: str, body: dict[str, Any]):
    fields = ", ".join(body.keys())
    # Deal with values being inserted
    valueArray = []
    for v in body.values():
        if isinstance(v, str):
            valueArray.append(f"'{v}'")
        elif v is None:
            valueArray.append("NULL")
        else:
            valueArray.append(str(v))
    values = ", ".join(valueArray)
    database.insert_into_table(name, fields, values);
    results = database.get_table(name);
    return {"payload": results}

@app.get("/table/{name}")
async def get_table(name: str):
    results = database.get_table(name); 
    return {"payload": results}

@app.post("/table/{name}/update")
async def update_table(name: str, request: UpdateRequest):
    database.update_table(name, request.rowIndex, request.columnName, request.pk, request.value);
    results = database.get_table(name); 
    return {"payload": results}

@app.post("/table/{name}/DeleteRow/{row_id}")
async def update_table(name: str, row_id: int):
    database.delete_from_table(name, row_id);
    results = database.get_table(name); 
    return {"payload": results}

@app.post("/login")
async def login(username: str = Query(...), password: str = Query(...)):
    status = database.test_user_connection(username, password); 
    if (status):
        database.set_user(username, password); 
        return {"connected": status}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")


# To run this: uvicorn Main:app --reload

# Command to run: npm run dev
# If need to clear database: Remove-Item -Path .\.next -Recurse -Force -ErrorAction SilentlyContinue