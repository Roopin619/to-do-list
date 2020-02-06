const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
const day = date();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://admin-roopin:roopin619@cluster0-6okls.mongodb.net/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const itemsSchema = new mongoose.Schema({
    name : String
});

const listSchema = new mongoose.Schema({
    name : String,
    items : [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({} , function(err,foundItems){
        if(err)
        console.log(err);
        else
        res.render("list", { listTitle: day , newListItem: foundItems});     
    });
});

app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName} , function(err,foundList){
        if(!err) {
            if(!foundList) {
                //create a new list
                const list = new List({
                    name : customListName,
                    items : []
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                //show an existing list
                res.render("list", { listTitle: foundList.name , newListItem: foundList.items});     
            }
        }
    });  
});

app.post("/", function (req, res) {
    
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name : itemName
    });

    if(listName === day) {
        item.save(function(err){      //shortcut for inserting one doc into DB  
            if(err)
            console.log(err);
            else
            res.redirect("/");
        }); 
    }
    else {
        List.findOne({name: listName} , function(err,foundList){
            foundList.items.push(item);
            foundList.save();            //to update our list with new item
            res.redirect("/" + listName);
        });
    }     
});

app.post("/delete", function (req, res) {
    
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === day) {
        Item.findByIdAndDelete(checkedItemID,function(err){
            if(!err)
            res.redirect("/");
        }); 
    }
    else {
        List.findOneAndUpdate({name: listName} , {$pull: {items : {_id : checkedItemID}}} , function(err,foundList){
            if(!err) {
                res.redirect("/" + listName);
            }
        });
    }  
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server has started successfully.");
});