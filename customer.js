var Customer = function (arrival,group) {
  this.arrival=arrival;
  this.wait_for_table=null;
  this.wait_for_dish=0;
  this.time_to_eat=0;
  this.finish_meal=0;
  this.departure=0;
  this.order_name='';
  this.order_prep_time=0;
  this.chef=null;
  this.group=group;
  this.table=null;
};

module.exports = Customer;
