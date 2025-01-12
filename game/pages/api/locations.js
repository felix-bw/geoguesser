import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    if (req.method === 'POST') {
      const { userLat, userLng, cityName } = req.body;

      if (!userLat || !userLng) {
        return res.status(400).json({ message: 'User coordinates are required.' });
      }

      
      const query = `
      SELECT 
        name, 
        ST_AsText(geom) AS geom,
        ST_DistanceSphere(
          geom,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        ) AS distance
      FROM stadt
      WHERE name = $3;
    `;

      const queryParams = [userLng, userLat, cityName];
      const result = await client.query(query, queryParams);
 

      const locations = result.rows.map(row => {
 
        const coordinates = row.geom.replace('POINT(', '').replace(')', '').split(' ');
        
        
        return {
          name: row.name,
          latitude: parseFloat(coordinates[1]),
          longitude: parseFloat(coordinates[0]),
          
          distance: row.distance ? row.distance / 1000 : null, 
         
        };
      });

      
      
    res.status(200).json(locations);
    } else if (req.method === 'GET') {
      const { search } = req.query;

      
      let query = `
        SELECT 
          name, 
          ST_AsText(geom) AS geom
        FROM stadt
      `;

      
      const queryParams = [];
      if (search) {
        query += ` WHERE name ILIKE $1`;
        queryParams.push(`%${search}%`);
      }

      const result = await client.query(query, queryParams);

      const locations = result.rows.map(row => {
        const coordinates = row.geom.replace('POINT(', '').replace(')', '').split(' ');
        return {
          name: row.name,
          latitude: parseFloat(coordinates[1]),
          longitude: parseFloat(coordinates[0]),
          distance: null 
        };
      });

      res.status(200).json(locations);
    } else {
     
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error fetching locations:', error.message);
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await client.end();
  }
}