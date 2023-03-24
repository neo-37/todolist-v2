require('dotenv').config();

const express = require("express");
const mongoose=require("mongoose");
const date=require(__dirname+"/date.js");
const _ = require("lodash");

const app = express();

app.use(express.urlencoded({extended:true}));
app.set("view engine", "ejs");
//app.use(express.static("public"));


// //setup for vercel or maybe hosting platforms in general
// // Require static assets from public folder
var path = require ('path');
 app.use(express.static(path.join(__dirname, "public")));
// // Set 'views' directory for any views 
// // being rendered res.render()
// app.set('views', path.join(__dirname, 'views'));
// // Set view engine as EJS
// // app.engine('html', require('ejs').renderFile);
// // app.set('view engine', 'html');




mongoose.connect(process.env.MONGODB_URI,
{useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected to cloud database!");
});


// mongoose.connect('mongodb://localhost:27017/todolistDB',
// {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false});

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log("we are connected to local database!");
// });

const itemSchema =new mongoose.Schema({
  name: String
});
const Item= mongoose.model("Item",itemSchema);

const item1= new Item({
  name:"Welcome to your todolist!"
});
const item2= new Item({
  name:"Hit the + button to add a new item."
});
const item3= new Item({
  name:"<-- Hit this to delete an item."
});
const defaultItems= [item1,item2,item3];

const listSchema=new mongoose.Schema({
  name:String,
  items:[itemSchema]
});
const List=mongoose.model("List",listSchema);

const taarik=date.getDate();

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get("/", function(req, res){
  Item.find({},function(err,foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else
        {
          console.log("Successfully saved default items to DB.");
          res.redirect("/");
        }
      });
    }else{
    res.render("list", {listTitle: taarik,newListItems:foundItems});
    }
  });
});

app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list=new List({
          name:customListName,
          items:defaultItems
        });
        list.save(function(err){
          if(!err){
              res.redirect("/"+customListName);
          }
        });
      }else{
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    }
  });
});

app.post("/",function(req,res){
  const itemName=req.body.newItem;
  const listName=req.body.iambutton;

 // console.log(req.body);
  const item=new Item({
    name:itemName
  });

  if(listName===taarik)
  {
    item.save(function(err){
      if(!err){
          res.redirect("/");
      }
    });
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save(function(){
        res.redirect("/"+listName);
      });
    });
  }
});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.tickbox;
  const listName=req.body.iamhiddeninputbox;

  Item.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
      if(listName===taarik){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }else{
        List.findOneAndUpdate({name:listName},
        {$pull:{items:{_id:checkedItemId}}},
      function(err,foundList){
        if(!err){
          res.redirect("/"+listName);
        }
      });
      }
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(process.env.PORT || 3000,function(){
  //Both of these will work
  //i)using template literals
  // console.log(`Listening on ${ port }`);
  //ii)using string concatenation
  console.log("server listening on port " + port + "!");
});

//app.listen(process.env.PORT || 3000,function(){
//   console.log("server started.");
// });