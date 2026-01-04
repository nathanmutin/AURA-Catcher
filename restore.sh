#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <path_to_backup>"
    exit 1
fi

FULL_PATH="$1"
CONTAINER_DB="aura-catcher-mariadb"
CONTAINER_BACKEND="aura-catcher-backend"

if [ ! -d "$FULL_PATH" ]; then
    echo "Error: Folder $FULL_PATH not found."
    exit 1
fi

echo "Restoring from $FULL_PATH..."

# 1. Restore Database
echo "Restoring database..."
if [ -f "$FULL_PATH/db.sql" ]; then
    docker exec -i $CONTAINER_DB sh -c 'mariadb -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < "$FULL_PATH/db.sql"
    echo "Database restored."
else
    echo "Warning: db.sql not found in backup."
fi

# 2. Restore Data
echo "Restoring data files..."
if [ -d "$FULL_PATH/data" ]; then
    # We copy the CONTENTS of the data folder into /usr/src/data
    # docker cp behaves differently depending on trailing slash.
    # We want to copy files inside $FULL_PATH/data/* into /usr/src/data/
    
    docker cp "$FULL_PATH/data/." $CONTAINER_BACKEND:/usr/src/data/
    echo "Data restored."
else
    echo "Warning: data directory not found in backup."
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "Restore operation complete."
