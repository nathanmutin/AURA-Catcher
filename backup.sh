#!/bin/bash

# Load environment variables from .env if present (optional, usually docker exec uses container envs)
# But we need container names. Assuming default names from compose.

CONTAINER_DB="aura-catcher-mariadb"
CONTAINER_BACKEND="aura-catcher-backend"

timestamp=$(date +%Y-%m-%d_%H-%M-%S)
backup_root="backups"
backup_dir="$backup_root/$timestamp"

mkdir -p "$backup_dir"

echo "Starting backup for timestamp: $timestamp"

# 1. Backup Database
echo "Backing up database..."
# We execute mariadb-dump INSIDE the container to use its environment variables (password, user, db name)
docker exec $CONTAINER_DB sh -c 'mariadb-dump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > "$backup_dir/db.sql"

if [ $? -eq 0 ]; then
    echo "Database backup successful."
else
    echo "Database backup failed!"
    exit 1
fi

# 2. Backup Data (Photos)
echo "Backing up data files..."
docker cp $CONTAINER_BACKEND:/usr/src/data "$backup_dir/data"

if [ $? -eq 0 ]; then
    echo "Data backup successful."
else
    echo "Data backup failed!"
    exit 1
fi

echo "Backup complete! Archive: $backup_root/$archive_name"
