from Database import Database; 

database = Database(); 

if __name__ == "__main__":
    print(database.test_user_connection("Administrator", "password"))