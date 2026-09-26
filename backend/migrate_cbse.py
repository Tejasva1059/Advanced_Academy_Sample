import sqlite3
import os

def migrate_db(db_path: str):
    if not os.path.exists(db_path):
        print(f"File not found: {db_path}")
        return
    print(f"Migrating {db_path}...")
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    columns_to_add = [
        ("school_settings", "affiliation_no", "VARCHAR(50) DEFAULT '1030183'"),
        ("school_settings", "school_code", "VARCHAR(50) DEFAULT '50161'"),
        ("school_settings", "city_office", "TEXT"),
        ("students", "attendance", "VARCHAR(50) DEFAULT '224/ 241'"),
        ("students", "promoted_to_class", "VARCHAR(50)"),
        ("students", "teacher_remarks", "VARCHAR(255) DEFAULT 'Excellent! Keep up the good work!'"),
        ("marks", "periodic_test", "FLOAT"),
        ("marks", "notebook", "FLOAT"),
        ("marks", "sub_enrichment", "FLOAT"),
        ("marks", "term_exam", "FLOAT"),
    ]

    for table, col, col_def in columns_to_add:
        try:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
            print(f"  + Added column {col} to {table}")
        except Exception as e:
            print(f"  - Column {col} on {table}: already exists or error ({e})")

    # Update school settings to Advanced Academy
    cur.execute("""
        UPDATE school_settings
        SET school_name = 'ADVANCED ACADEMY',
            affiliation_no = '1030183',
            school_code = '50161',
            address = 'ISKCON Vihar Colony, Nipania Road, Indore - 452010 (M.P.) Contact : 7415666676, 7415666686, 9827720868, 9691125004',
            city_office = 'City Office : Baikunthdham, (Near Anand Bazaar), Indore - 452018 Phone : (0731) 2561192, 7415061192',
            email = 'advancedindore@gmail.com',
            website = 'www.advancedacademyindore.com',
            report_card_header_text = 'Report Card : Annual Exam'
        WHERE id = 1
    """)

    con.commit()
    con.close()
    print(f"Completed migration for {db_path}!\n")

if __name__ == "__main__":
    migrate_db("school.db")
    migrate_db("../school.db")
