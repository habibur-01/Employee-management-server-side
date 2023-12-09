const express = require('express')
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors(
  {origin: [
    'http://localhost:5173',
    'https://employe-management-1b2e8.web.app',
    'https://employe-management-1b2e8.firebaseapp.com'
  ], 
  credentials: true}
))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cbqlcas.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("managementEmployee").collection("users")
    const courseCollection = client.db("managementEmployee").collection("courses");
    const instructorCollection = client.db("managementEmployee").collection("instructors")
    const testimonialsCollection = client.db("managementEmployee").collection("testimonials")
    const taskCollection = client.db("managementEmployee").collection("taskSheet")


    // jwt api related
    app.post('/jwt', async(req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({token})
    })

    // verify middleware
    // const verifyToken = (req, res, next) => {
    //   console.log( 'inside verify token', req.headers)
    //   if(!req.headers.authorization){
    //     return res.status(401).send({message: "forbidden access"});
    //   }
    //   const token = req.headers.authorization.split(' ')[1];
    //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //     if(err){
    //       return res.status(401).send({message:'forbidden access'})
    //     }
    //     req.decoded = decoded;
    //     next()
    //   })
      // next()
    // }

     // use verify admin after verifyToken
    //  const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   const isAdmin = user?.role === 'Admin';
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' });
    //   }
    //   next();
    // }

    // taskSheet
    app.post('/tasksheet', async(req,res) => {
      const task = req.body
      const result = await taskCollection.insertOne(task)
      res.send(result)
    })

    app.get('/tasksheet', async(req, res) => {
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
    }
      const result = await taskCollection.find(query).toArray()
      res.send(result)
    })

    // get user related api
    app.post('/users',  async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users',  async (req, res) => {
      // console.log(req.headers)
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
    }
      const cursor = userCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })


    // app.get('/users/admin/:email', async (req, res) => {
    //   const email = req.params.email;

    //   if (email !== req.decoded.email) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }

    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   let admin = false;
    //   if (user) {
    //     admin = user?.role === 'Admin';
    //   }
    //   res.send({ admin });
    // })
    app.get('/users/admin', async(req, res) =>{
      const filter = {role: {$ne: "Admin"}};
      const cursor = userCollection.find(filter)
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/users/HR', async(req, res) => {
      const filter = {role: "Employee"}
      const cursor = userCollection.find(filter)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.patch('/users/HR/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          isVerified: true
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    // update user make HR
    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          role: "HR"
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    // delete user
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set:{
          isFired: true
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
  })

    // get course details data
    app.get('/courses', async (req, res) => {
      const cursor = courseCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    // get instructors details
    app.get('/instructors', async (req, res) => {
      const cursor = instructorCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    // get testimonials details
    app.get('/testimonials', async (req, res) => {
      const cursor = testimonialsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})