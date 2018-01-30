// Punch config file format

/*

key: value

user.name = Anthony McCoy
user.address.street = 1928 E 11th Ave
user.address.city = Spokane
user.address.state = WA
user.address.zip = 99202

scene
  /content:
     This is some shit
     that goes on. And stuff.
     on multiple lines.

user
  .name: Anthony McCoy
  .company: Rat Wizard
  .phone: 425-443-7565
  .address
    .street: 1928 E 11th Ave
    .city: Spokane
    .state: WA
    .zip: 99292

projects
  .bidpro
    .name: BidPro
    .hourlyRate: 20\.00
    .client: @ray

  <.workstudy
    .name: SCC Graphics
    .hourlyRate: 11

projects
  /bidpro
    /name: BidPro
    /hourlyRate: 20.00
    /client: @ray

  /workstudy
    /name: SCC Graphics

Parsing rules:
  - ignore line breaks
  - if . is encountered, start of nested property
  - if : is encountered, the following text until the next . is the value for the current property
  - if end of file is reached, everything up to that point is part of the current value
  - if inside a value, . and : will be ignored after a \ character
  - Values don't have types - everything is a string

*/
