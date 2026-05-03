from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector.errors import Error, ProgrammingError
from typing import Dict, Any


class Database:
    def __init__(self):
        self.host = "100.90.167.69"
        self.user = "admin"
        self.password = "Waronline12345#"
        self.database = "737MAX_DB"
    
    def __get_db_connection(self):
        return mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database
        )

    def test_user_connection(self, username, password):
        try:
            conn = mysql.connector.connect(
                host=self.host,
                user=username,
                password=password,
                database=self.database
            )   
            conn.close()
            return True
        except Error as e:
            return False
        # except Error as e:
        #     return str(e)  # Return the error instead of False
    
    def set_user(self, user, password):
        self.user = user; 
        self.password = password;


    def get_state_vector(self):
        conn = self.__get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute("SELECT * FROM State_Vector")
        self.table = cursor.fetchall()
        cursor.close()
        conn.close()
        return self.table;

    def get_faults(self):
        conn = self.__get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute("CALL get_fault_logs()")
        self.table = cursor.fetchall()
        cursor.close()
        conn.close()
        return self.table;

    def get_navstate(self):
            conn = self.__get_db_connection()
            cursor = conn.cursor(dictionary=True) 
            cursor.execute("CALL get_current_route_info()")
            self.table = cursor.fetchall()
            cursor.close()
            conn.close()
            return self.table;

    def get_table(self, name):
        conn = self.__get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute(f"SELECT * FROM {name}")
        self.table = cursor.fetchall()
        cursor.close()
        conn.close()
        return self.table;   

    def table_exists(self, name):
        conn = self.__get_db_connection()
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            # SELECT 1 is faster and creates an empty result set that doesn't need fetching
            cursor.execute(f"SELECT 1 FROM {name} LIMIT 1")
            cursor.fetchone(); 
            return True
        except ProgrammingError:
            return False
        except Exception:
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def update_table(self, name, rowIndex, columName, PK, value):
        conn = self.__get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute(f"UPDATE {name} SET {columName} = '{value}' WHERE {PK} = {rowIndex}")
        self.table = cursor.fetchall()
        cursor.close()
        conn.commit();
        conn.close()
        return self.table;

    def insert_into_table(self, name, fieldList, valueList):
        conn = self.__get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute(f"INSERT INTO {name} ({fieldList}) VALUES ({valueList})")
        cursor.close()
        conn.commit();
        conn.close()

    def delete_from_table(self, name, row_id):
        conn = self.__get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        cursor.execute(f"CALL delete_from_{name}(%s)", (row_id,)) # MUST have a trailing comma for execute 
        cursor.close()
        conn.commit();
        conn.close()