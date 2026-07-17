from app.database import engine

try:
    connection = engine.connect()
    print("Database connected!")
    connection.close()

except Exception as e:
    print(e)