create database project_3;
USE project_3;

create table users(
id int auto_increment,
first_name varchar(100),
last_name varchar(100),
username varchar(100),
password varchar(1000),
is_admin bool,
primary key(id)
);

create table vacations(
id int auto_increment,
description text,
destination varchar(200),
img_url text, 
departure_date datetime,
arrival_date datetime,
price int,
primary key(id)
);

create table followers(
id int auto_increment,
vacation_id int,
users_id int,
primary key(id),
foreign key(vacation_id) references vacations(id),
foreign key(users_id) references users(id)
);

alter table vacations add fulltext(destination);