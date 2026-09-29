import os
import oracledb

from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


app = FastAPI(title="Agriculture Crop M4anagement System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_SERVICE = os.getenv("DB_SERVICE")


def get_connection():
    dsn = oracledb.makedsn(
        DB_HOST,
        int(DB_PORT),
        service_name=DB_SERVICE
    )

    return oracledb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        dsn=dsn
    )

@app.get("/")
def home():
    return {
        "message": "Agriculture Crop Management System API is running"
    }

@app.get("/db-test")
def database_test():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM SYSTEM.FARMER")
    farmer_count = cursor.fetchone()[0]

    cursor.close()
    connection.close()

    return {
        "database": "connected",
        "container": "CDB$ROOT",
        "farmer_count": farmer_count
    }

@app.get("/farmers")
def get_farmers():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT farmer_id, farmer_name, phone, village, created_at
        FROM SYSTEM.FARMER
        ORDER BY farmer_id
    """)

    rows = cursor.fetchall()

    farmers = []

    for row in rows:
        farmers.append({
            "farmer_id": row[0],
            "farmer_name": row[1],
            "phone": row[2],
            "village": row[3],
            "created_at": str(row[4]) if row[4] else None
        })

    cursor.close()
    connection.close()

    return farmers

from fastapi import HTTPException

@app.post("/farmers")
def create_farmer(data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        farmer_name = data.get("farmer_name")
        phone = data.get("phone")
        village = data.get("village")

        if not farmer_name or not village:
            return {
                "error": "Farmer name and village are required"
            }

        cursor.execute(
            """
            INSERT INTO SYSTEM.FARMER
            (farmer_name, phone, village, created_at)
            VALUES (:1, :2, :3, SYSTIMESTAMP)
            """,
            (
                farmer_name,
                phone,
                village
            )
        )

        connection.commit()

        return {
            "message": "Farmer added successfully"
        }

    except Exception as e:
        connection.rollback()
        print("FARMER INSERT ERROR:", repr(e))
        raise

    finally:
        cursor.close()
        connection.close()

@app.put("/farmers/{farmer_id}")
def update_farmer(farmer_id: int, farmer: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE SYSTEM.FARMER
        SET farmer_name = :1,
            phone = :2,
            village = :3
        WHERE farmer_id = :4
    """, (
        farmer["farmer_name"],
        farmer["phone"],
        farmer["village"],
        farmer_id
    ))

    connection.commit()

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()
        return {"message": "Farmer not found"}

    cursor.close()
    connection.close()

    return {
        "message": "Farmer updated successfully",
        "farmer_id": farmer_id
    }

@app.delete("/farmers/{farmer_id}")
def delete_farmer(farmer_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM SYSTEM.FARMER
            WHERE farmer_id = :1
        """, (farmer_id,))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Farmer not found"
            )

        connection.commit()

        return {
            "message": "Farmer deleted successfully",
            "farmer_id": farmer_id
        }

    except oracledb.IntegrityError as e:
        connection.rollback()

        error_message = str(e)
        print("FARMER DELETE DATABASE ERROR:", error_message)

        if "ORA-02292" in error_message:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete this farmer because related field records exist. Delete the related fields first."
            )

        raise HTTPException(
            status_code=409,
            detail=f"Database constraint prevented deletion: {error_message}"
        )

    except HTTPException:
        connection.rollback()
        raise

    except Exception as e:
        connection.rollback()
        print("FARMER DELETE ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to delete farmer."
        )

    finally:
        cursor.close()
        connection.close()


@app.get("/fields")
def get_fields():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT field_id,
               farmer_id,
               field_name,
               area_acres,
               soil_type,
               irrigation_type
        FROM SYSTEM.FIELD
        ORDER BY field_id
    """)

    rows = cursor.fetchall()

    fields = []

    for row in rows:
        fields.append({
            "field_id": row[0],
            "farmer_id": row[1],
            "field_name": row[2],
            "area_acres": float(row[3]) if row[3] is not None else None,
            "soil_type": row[4],
            "irrigation_type": row[5]
        })

    cursor.close()
    connection.close()

    return fields


@app.post("/fields")
def add_field(field: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO SYSTEM.FIELD
        (farmer_id, field_name, area_acres, soil_type, irrigation_type)
        VALUES (:1, :2, :3, :4, :5)
    """, (
        field["farmer_id"],
        field["field_name"],
        field["area_acres"],
        field["soil_type"],
        field["irrigation_type"]
    ))

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Field added successfully"
    }

@app.put("/fields/{field_id}")
def update_field(field_id: int, field: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE SYSTEM.FIELD
        SET farmer_id = :1,
            field_name = :2,
            area_acres = :3,
            soil_type = :4,
            irrigation_type = :5
        WHERE field_id = :6
    """, (
        field["farmer_id"],
        field["field_name"],
        field["area_acres"],
        field["soil_type"],
        field["irrigation_type"],
        field_id
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Field updated successfully"}


@app.delete("/fields/{field_id}")
def delete_field(field_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM SYSTEM.FIELD
        WHERE field_id = :1
    """, (field_id,))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Field deleted successfully"}

@app.get("/crops")
def get_crops():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT crop_id, crop_name, crop_type, season, duration_days
        FROM SYSTEM.CROP
        ORDER BY crop_id
    """)

    rows = cursor.fetchall()

    crops = []

    for row in rows:
        crops.append({
            "crop_id": row[0],
            "crop_name": row[1],
            "crop_type": row[2],
            "season": row[3],
            "duration_days": row[4]
        })

    cursor.close()
    connection.close()

    return crops

@app.post("/crops")
def add_crop(crop: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO SYSTEM.CROP
        (crop_name, crop_type, season, duration_days)
        VALUES (:1, :2, :3, :4)
    """, (
        crop["crop_name"],
        crop["crop_type"],
        crop["season"],
        crop["duration_days"]
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Crop added successfully"}


@app.put("/crops/{crop_id}")
def update_crop(crop_id: int, crop: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE SYSTEM.CROP
        SET crop_name = :1,
            crop_type = :2,
            season = :3,
            duration_days = :4
        WHERE crop_id = :5
    """, (
        crop["crop_name"],
        crop["crop_type"],
        crop["season"],
        crop["duration_days"],
        crop_id
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Crop updated successfully"}

@app.delete("/crops/{crop_id}")
def delete_crop(crop_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM SYSTEM.CROP
        WHERE crop_id = :1
    """, (crop_id,))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Crop deleted successfully"}


@app.get("/cultivations")
def get_cultivations():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT cultivation_id,
               field_id,
               crop_id,
               sowing_date,
               expected_harvest_date,
               quantity_planted,
               status
        FROM SYSTEM.CULTIVATION
        ORDER BY cultivation_id
    """)

    rows = cursor.fetchall()

    cultivations = []

    for row in rows:
        cultivations.append({
            "cultivation_id": row[0],
            "field_id": row[1],
            "crop_id": row[2],
            "sowing_date": str(row[3]) if row[3] else None,
            "expected_harvest_date": str(row[4]) if row[4] else None,
            "quantity_planted": float(row[5]) if row[5] is not None else None,
            "status": row[6]
        })

    cursor.close()
    connection.close()

    return cultivations

@app.post("/cultivations")
def add_cultivation(cultivation: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO SYSTEM.CULTIVATION
        (field_id, crop_id, sowing_date,
         expected_harvest_date, quantity_planted, status)
        VALUES (
            :1, :2,
            TO_DATE(:3, 'YYYY-MM-DD'),
            TO_DATE(:4, 'YYYY-MM-DD'),
            :5, :6
        )
    """, (
        cultivation["field_id"],
        cultivation["crop_id"],
        cultivation["sowing_date"],
        cultivation["expected_harvest_date"],
        cultivation["quantity_planted"],
        cultivation["status"]
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Cultivation added successfully"}

@app.put("/cultivations/{cultivation_id}")
def update_cultivation(cultivation_id: int, data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE SYSTEM.CULTIVATION
            SET field_id = :1,
                crop_id = :2,
                sowing_date = TO_DATE(:3, 'YYYY-MM-DD'),
                expected_harvest_date = TO_DATE(:4, 'YYYY-MM-DD'),
                quantity_planted = :5,
                status = :6
            WHERE cultivation_id = :7
        """, (
            data["field_id"],
            data["crop_id"],
            data["sowing_date"],
            data.get("expected_harvest_date"),
            data.get("quantity_planted"),
            data.get("status", "Active"),
            cultivation_id
        ))

        if cursor.rowcount == 0:
            return {"message": "Cultivation not found"}

        connection.commit()

        return {
            "message": "Cultivation updated successfully",
            "cultivation_id": cultivation_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


@app.delete("/cultivations/{cultivation_id}")
def delete_cultivation(cultivation_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM SYSTEM.CULTIVATION
            WHERE cultivation_id = :1
        """, (cultivation_id,))

        if cursor.rowcount == 0:
            return {"message": "Cultivation not found"}

        connection.commit()

        return {
            "message": "Cultivation deleted successfully",
            "cultivation_id": cultivation_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()

@app.get("/irrigations")
def get_irrigations():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            irrigation_id,
            cultivation_id,
            irrigation_date,
            water_quantity,
            method,
            remarks
        FROM SYSTEM.IRRIGATION
        ORDER BY irrigation_id
    """)

    rows = cursor.fetchall()

    result = []

    for row in rows:
        result.append({
            "irrigation_id": row[0],
            "cultivation_id": row[1],
            "irrigation_date": str(row[2]),
            "water_quantity": float(row[3]) if row[3] is not None else None,
            "method": row[4],
            "remarks": row[5]
        })

    cursor.close()
    connection.close()

    return result

@app.post("/irrigations")
def add_irrigation(data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO SYSTEM.IRRIGATION
        (cultivation_id, irrigation_date,
         water_quantity, method, remarks)
        VALUES (
            :1,
            TO_DATE(:2, 'YYYY-MM-DD'),
            :3, :4, :5
        )
    """, (
        data["cultivation_id"],
        data["irrigation_date"],
        data["water_quantity"],
        data["method"],
        data["remarks"]
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Irrigation added successfully"}

@app.put("/irrigations/{irrigation_id}")
def update_irrigation(irrigation_id: int, data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE SYSTEM.IRRIGATION
            SET cultivation_id = :1,
                irrigation_date = TO_DATE(:2, 'YYYY-MM-DD'),
                water_quantity = :3,
                method = :4,
                remarks = :5
            WHERE irrigation_id = :6
        """, (
            data["cultivation_id"],
            data["irrigation_date"],
            data.get("water_quantity"),
            data.get("method"),
            data.get("remarks"),
            irrigation_id
        ))

        if cursor.rowcount == 0:
            return {"message": "Irrigation not found"}

        connection.commit()

        return {
            "message": "Irrigation updated successfully",
            "irrigation_id": irrigation_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


@app.delete("/irrigations/{irrigation_id}")
def delete_irrigation(irrigation_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM SYSTEM.IRRIGATION
            WHERE irrigation_id = :1
        """, (irrigation_id,))

        if cursor.rowcount == 0:
            return {"message": "Irrigation not found"}

        connection.commit()

        return {
            "message": "Irrigation deleted successfully",
            "irrigation_id": irrigation_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


@app.get("/fertilizers")
def get_fertilizers():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            fertilizer_id,
            cultivation_id,
            fertilizer_name,
            quantity,
            application_date,
            remarks
        FROM SYSTEM.FERTILIZER
        ORDER BY fertilizer_id
    """)

    rows = cursor.fetchall()

    result = []

    for row in rows:
        result.append({
            "fertilizer_id": row[0],
            "cultivation_id": row[1],
            "fertilizer_name": row[2],
            "quantity": float(row[3]) if row[3] is not None else None,
            "application_date": str(row[4]),
            "remarks": row[5]
        })

    cursor.close()
    connection.close()

    return result

@app.post("/fertilizers")
def add_fertilizer(data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO SYSTEM.FERTILIZER
        (cultivation_id, fertilizer_name,
         quantity, application_date, remarks)
        VALUES (
            :1, :2, :3,
            TO_DATE(:4, 'YYYY-MM-DD'),
            :5
        )
    """, (
        data["cultivation_id"],
        data["fertilizer_name"],
        data["quantity"],
        data["application_date"],
        data["remarks"]
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Fertilizer added successfully"}

@app.put("/fertilizers/{fertilizer_id}")
def update_fertilizer(fertilizer_id: int, data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE SYSTEM.FERTILIZER
            SET cultivation_id = :1,
                fertilizer_name = :2,
                quantity = :3,
                application_date = TO_DATE(:4, 'YYYY-MM-DD'),
                remarks = :5
            WHERE fertilizer_id = :6
        """, (
            data["cultivation_id"],
            data["fertilizer_name"],
            data.get("quantity"),
            data["application_date"],
            data.get("remarks"),
            fertilizer_id
        ))

        if cursor.rowcount == 0:
            return {"message": "Fertilizer not found"}

        connection.commit()

        return {
            "message": "Fertilizer updated successfully",
            "fertilizer_id": fertilizer_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


@app.delete("/fertilizers/{fertilizer_id}")
def delete_fertilizer(fertilizer_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM SYSTEM.FERTILIZER
            WHERE fertilizer_id = :1
        """, (fertilizer_id,))

        if cursor.rowcount == 0:
            return {"message": "Fertilizer not found"}

        connection.commit()

        return {
            "message": "Fertilizer deleted successfully",
            "fertilizer_id": fertilizer_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()

@app.get("/harvests")
def get_harvests():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            harvest_id,
            cultivation_id,
            harvest_date,
            quantity_harvested,
            quality_grade,
            selling_price,
            remarks
        FROM SYSTEM.HARVEST
        ORDER BY harvest_id
    """)

    rows = cursor.fetchall()

    result = []

    for row in rows:
        result.append({
            "harvest_id": row[0],
            "cultivation_id": row[1],
            "harvest_date": str(row[2]),
            "quantity_harvested": float(row[3]) if row[3] is not None else None,
            "quality_grade": row[4],
            "selling_price": float(row[5]) if row[5] is not None else None,
            "remarks": row[6]
        })

    cursor.close()
    connection.close()

    return result

@app.post("/harvests")
def add_harvest(data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO SYSTEM.HARVEST
        (cultivation_id, harvest_date,
         quantity_harvested, quality_grade,
         selling_price, remarks)
        VALUES (
            :1,
            TO_DATE(:2, 'YYYY-MM-DD'),
            :3, :4, :5, :6
        )
    """, (
        data["cultivation_id"],
        data["harvest_date"],
        data["quantity_harvested"],
        data["quality_grade"],
        data["selling_price"],
        data["remarks"]
    ))

    connection.commit()
    cursor.close()
    connection.close()

    return {"message": "Harvest added successfully"}

@app.put("/harvests/{harvest_id}")
def update_harvest(harvest_id: int, data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE SYSTEM.HARVEST
            SET cultivation_id = :1,
                harvest_date = TO_DATE(:2, 'YYYY-MM-DD'),
                quantity_harvested = :3,
                quality_grade = :4,
                selling_price = :5,
                remarks = :6
            WHERE harvest_id = :7
        """, (
            data["cultivation_id"],
            data["harvest_date"],
            data.get("quantity_harvested"),
            data.get("quality_grade"),
            data.get("selling_price"),
            data.get("remarks"),
            harvest_id
        ))

        if cursor.rowcount == 0:
            return {"message": "Harvest not found"}

        connection.commit()

        return {
            "message": "Harvest updated successfully",
            "harvest_id": harvest_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


@app.delete("/harvests/{harvest_id}")
def delete_harvest(harvest_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM SYSTEM.HARVEST
            WHERE harvest_id = :1
        """, (harvest_id,))

        if cursor.rowcount == 0:
            return {"message": "Harvest not found"}

        connection.commit()

        return {
            "message": "Harvest deleted successfully",
            "harvest_id": harvest_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()



@app.get("/config-test")
def config_test():
    return {
        "DB_USER": DB_USER,
        "DB_PASSWORD": "SET" if DB_PASSWORD else "MISSING",
        "DB_HOST": DB_HOST,
        "DB_PORT": DB_PORT,
        "DB_SERVICE": DB_SERVICE
    }

@app.get("/oracle-info")
def oracle_info():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            SYS_CONTEXT('USERENV', 'CON_NAME'),
            SYS_CONTEXT('USERENV', 'CURRENT_USER')
        FROM dual
    """)

    container, username = cursor.fetchone()

    cursor.execute("""
        SELECT COUNT(*)
        FROM all_tables
        WHERE table_name = 'FARMER'
    """)

    farmer_visible = cursor.fetchone()[0]

    cursor.close()
    connection.close()

    return {
        "container": container,
        "username": username,
        "farmer_visible": farmer_visible
    }

@app.get("/debug-db")
def debug_db():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            SYS_CONTEXT('USERENV', 'DB_NAME'),
            SYS_CONTEXT('USERENV', 'INSTANCE_NAME'),
            SYS_CONTEXT('USERENV', 'SERVICE_NAME'),
            SYS_CONTEXT('USERENV', 'CON_NAME'),
            SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA'),
            SYS_CONTEXT('USERENV', 'CURRENT_USER')
        FROM dual
    """)

    db_name, instance, service, container, schema, user = cursor.fetchone()

    cursor.execute("""
        SELECT
            (SELECT COUNT(*) FROM SYSTEM.FARMER),
            (SELECT COUNT(*) FROM SYSTEM.FIELD),
            (SELECT COUNT(*) FROM SYSTEM.CROP),
            (SELECT COUNT(*) FROM SYSTEM.CULTIVATION),
            (SELECT COUNT(*) FROM SYSTEM.IRRIGATION),
            (SELECT COUNT(*) FROM SYSTEM.FERTILIZER),
            (SELECT COUNT(*) FROM SYSTEM.HARVEST)
        FROM dual
    """)

    counts = cursor.fetchone()

    cursor.close()
    connection.close()

    return {
        "db_name": db_name,
        "instance": instance,
        "service": service,
        "container": container,
        "schema": schema,
        "user": user,
        "counts": {
            "farmer": counts[0],
            "field": counts[1],
            "crop": counts[2],
            "cultivation": counts[3],
            "irrigation": counts[4],
            "fertilizer": counts[5],
            "harvest": counts[6]
        }
    }

@app.get("/dashboard/stats")
def dashboard_stats():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        tables = {
            "farmers": "SYSTEM.FARMER",
            "fields": "SYSTEM.FIELD",
            "crops": "SYSTEM.CROP",
            "cultivation": "SYSTEM.CULTIVATION",
            "irrigation": "SYSTEM.IRRIGATION",
            "fertilizer": "SYSTEM.FERTILIZER",
            "harvest": "SYSTEM.HARVEST"
        }

        stats = {}

        for key, table in tables.items():
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[key] = cursor.fetchone()[0]

        return stats

    finally:
        cursor.close()
        connection.close()