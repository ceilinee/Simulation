var Customer = function (arrival) {
  this.arrival=arrival;
  this.departure=0;
  this.orderpreptime=0;
  this.server=null;
  this.eattime=0;
  this.table=null;
};

module.exports = Customer;
