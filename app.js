const express = require("express");
require('dotenv').config();
const _ = require("lodash");
// recebe a function exportada sem a call da mesma...
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Heroku with atlas database
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

// The name of the homepage list
const generalListName = "General";
const dateModel = date.getDateModel();

const itemsSchema = {
  description: {
    type: String,
    required: (1, "You need to write anything to store...")
  }
};
const Item = mongoose.model("item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("list", listSchema);

const defaultItems = [
  new Item({ description: "Welcome to your todolist!" }),
  new Item({ description: "Hit the + button to add a new item." }),
  new Item({ description: "<-- Hit this to delete an item." })
];

app.get("/", function(req, res) {

  Item.find({},function (err, foundItems) {
    if(err){
      console.log(err);
    }else{
      // if we dont have a list, then we create and add the default items to this (not stored in DB)
      if(foundItems.length === 0){

        Item.insertMany(defaultItems, function(err) {
          if(err){
            console.log(err);
          }else{
            console.log("Sucessfully saved default items to Database!");
          }
        });
        res.redirect("/");
      }else{
        res.render("list", { listTitle: generalListName, datemodel: dateModel, items: foundItems });
      }
    }
  });
});

app.post("/", function (req, res) {

  const listName = req.body.list
  const newItemDescription = req.body.newItem;

  const newItem = new Item({ description: newItemDescription });

  if(listName === generalListName){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete",function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;


  if (listName === generalListName) {
    Item.deleteOne({_id: checkedItemId},  function (err) {
      if (err)
        console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList){
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const listName = _.capitalize(req.params.customListName);

  List.findOne({ name:listName }, function (err, foundList) {
    if (err) {
      console.log(err);
    } else {
      // if the search (findOne) dont find anything
      if (!foundList) {
        const list = new List({
          name: listName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+listName);
      } else {
        if(foundList.items.length === 0){
          foundList.items = defaultItems;
          foundList.save();
        } else {
          res.render("list", { listTitle: foundList.name, datemodel: dateModel, items: foundList.items });
        }
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server is running...");
});
