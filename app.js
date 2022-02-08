//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: {type:String, required:[true]}
});

const Item = mongoose.model("Item", itemsSchema);

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List =  mongoose.model("List", listsSchema);

const item1 = new Item({
  name: "Welcome to ToDoList."
});

const item2 = new Item({
  name: "Tap + to add new Item."
});

const item3 = new Item({
  name: "<-- Check the box to delete the item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully Saved all the items.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listTitle = req.body.listTitle;

  if(listTitle === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      console.log("Removing Item Unsuccessful.");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listTitle},{
      $pull: {items: {_id: checkedItemID}}
    }, function(err, result){
      if(!err){
        res.redirect("/" + listTitle);
      }
    });
  }
});

app.get("/:list", function(req, res){
  const customListName = _.capitalize(req.params.list);

  List.findOne({name: customListName}, function(err, result){
    if(!err){
      if(!result){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }else{
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
    }else{
      console.log("Error Occured!")
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
