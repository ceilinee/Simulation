var Customer = function (arrival) {
  this.arrival=arrival;
  this.wait_for_table=0;
  this.wait_for_dish=0;
  this.time_to_eat=0;
  this.departure=0;
  this.order_prep_time=0;
  this.chef=null;
  this.table=null;
};

module.exports = Customer;
