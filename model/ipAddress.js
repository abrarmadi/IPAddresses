var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ipAddress = new Schema({
ip_address: {type:String, required:true , unique:true},
continent_code: String,
continent_name:String,
country_code:String,
country_name:String,
region_code:String,
region_name:String,
city:String,
zip:String
});
module.exports = mongoose.model('IpAddress',ipAddress);