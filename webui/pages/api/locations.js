import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  console.log(process.env.DATABASE_URL);
  console.log("vor await");
  await client.connect();
  console.log("nach await");

  try {
    const { role } = req.body || req.query; // Rolle entweder aus Body oder Query extrahieren

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    // Setze die Rolle
    await client.query(`SET ROLE ${role};`);

    // Handle GET requests (Fetching data)
    if (req.method === 'GET') {
      const { search } = req.query; // Suche-Parameter extrahieren

      let query = 'SELECT name, ST_AsText(geom) FROM stadt';
      const queryParams = [];

      if (search) {
        query += ' WHERE name ILIKE $1'; // Verwende ILIKE für case-insensitive Suche
        queryParams.push(`%${search}%`);
      }

      const result = await client.query(query, queryParams);
      const locations = result.rows.map(row => {
        const coordinates = row.st_astext
          .replace('POINT(', '')
          .replace(')', '')
          .split(' ');
        return {
          name: row.name,
          longitude: parseFloat(coordinates[0]),
          latitude: parseFloat(coordinates[1]),
        };
      });

      res.setHeader('Cache-Control', 'no-store'); // Cache deaktivieren
      res.status(200).json(locations);

    // Handle POST requests (Inserting data)
    } else if (req.method === 'POST') {
      const { name, longitude, latitude } = req.body;

      if (!name || !longitude || !latitude) {
        return res.status(400).json({ message: 'Name, longitude, and latitude are required' });
      }

      const insertQuery = `
        INSERT INTO stadt (name, geom, owner)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4) RETURNING *;
      `;
      const result = await client.query(insertQuery, [name, longitude, latitude, role]);

      res.status(201).json(result.rows[0]);

    // Handle PUT requests (Updating data)
    } else if (req.method === 'PUT') {
      const { name, longitude, latitude } = req.body;

      if (!name || !longitude || !latitude) {
        return res.status(400).json({ message: 'Name, longitude, and latitude are required' });
      }

      const updateQuery = `
        UPDATE stadt
        SET geom = ST_SetSRID(ST_MakePoint($2, $3), 4326)
        WHERE name = $1 AND owner = $4 RETURNING *;
      `;
      const result = await client.query(updateQuery, [name, longitude, latitude, role]);

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Stadt nicht gefunden oder keine Berechtigung' });
      } else {
        res.status(200).json(result.rows[0]);
      }

    // Handle DELETE requests (Deleting data)
    } else if (req.method === 'DELETE') {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const deleteQuery = `DELETE FROM stadt WHERE name = $1 AND owner = $2 RETURNING *;`;
      const result = await client.query(deleteQuery, [name, role]);

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Stadt nicht gefunden oder keine Berechtigung' });
      } else {
        res.status(200).json({ message: `Stadt ${name} wurde gelöscht.` });
      }

    // If the request method is not supported
    } else {
      res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
  } catch (error) {
    console.error('Fehler in der API:', error.message, error.stack);
    res.status(500).json({ message: 'Interner Serverfehler' });
  } finally {
    await client.end();
  }
}
