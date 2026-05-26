from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_logistics_contact_columns(engine: Engine):
    inspector = inspect(engine)
    if "logistics_contacts" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("logistics_contacts")
    }
    missing_columns = {
        "whatsapp_phone": "VARCHAR(80)",
        "instagram_url": "VARCHAR(255)",
        "facebook_url": "VARCHAR(255)",
        "tiktok_url": "VARCHAR(255)",
    }

    # Keeps older local databases compatible when new optional contact fields are added.
    with engine.begin() as connection:
        for column_name, column_type in missing_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE logistics_contacts ADD COLUMN {column_name} {column_type}"
                    )
                )
