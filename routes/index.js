const express = require('express');
const router = express.Router();
const sqlite3=require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const { count, info } = require('console');
const nodemailer = require ('nodemailer');
const passport = require ('passport');
const { appendFile } = require('fs');
const session = require ('express-session');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
require('dotenv').config();


const basededatos=path.join(__dirname,"BD","BD.db");
const bd=new sqlite3.Database(basededatos, err =>{ 
if (err){
	return console.error(err.message);
}else{
	console.log("db only");
}
})

const create="CREATE TABLE IF NOT EXISTS contactos(email VARCHAR(20),nombre VARCHAR(20), comentario TEXT,fecha DATATIME,ip VARCHAR(30),ubi VARCHAR(20));";

bd.run(create,err=>{
	if (err){
	return console.error(err.message);
}else{
	console.log("table only");
}
})

router.get('/contactos',(req,res)=>{
	const sql="SELECT * FROM contactos;";
	bd.all(sql, [],(err, rows)=>{
			if (err){
				return console.error(err.message);
			}else{
			res.render("contactos.ejs",{obtener:rows});
			}
	})
})


router.use(session({
	secret:'Super secret',
	resave: true,
	saveUninitialized: true
}));

router.use(passport.authenticate('session'));

passport.serializeUser(function(user, cb) {
	process.nextTick(function() {
	  cb(null, { id: user.id, username: user.username, name: user.name });
	});
  });

  passport.deserializeUser(function(user, cb) {
	process.nextTick(function() {
	  return cb(null, user);
	});
  });



router.get('/login', (req,res) => {
	res.render("login")
});


const usser = process.env.USSER;
const pass = process.env.PASSW;
router.post('/login', (req,res) => {
	 var usuario=req.body.usuario;
	  var contra=req.body.contra;
		console.log(usuario,contra)
	if (usuario === usser && contra === pass) {
	
	res.redirect('/contactos')
	}else{
		res.send("Usuario invalido")
	}
	
});

router.get('/login/federated/google', passport.authenticate('google'));


passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SC,
      callbackURL: "http://nemesis2022.herokuapp.com/google/callback",
	  scope: [
		"https://www.googleapis.com/auth/userinfo.profile",
		"https://www.googleapis.com/auth/userinfo.email",
	  ],
	  session: false,
    },
    function (accessToken, refreshToken, profile, done) {
		console.log(profile); 
		done(null, profile)
      }));



	  router.get('/google/callback', passport.authenticate('google', {
		successRedirect: '/contactos',
		failureRedirect: '/login'
	  }));




router.post('/',(req,res)=>{
  	var hoy = new Date();
  	var horas = hoy.getHours();
  	var minutos = hoy.getMinutes();
  	var segundos = hoy.getSeconds()
  	var hora = horas + ':' + minutos + ':' + segundos + ' '
  	var fecha = hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear() + '//' + hora;

	var ip = req.headers["x-forwarded-for"];
  	if (ip){
    var list = ip.split(",");
    ip= list[list.length-1];
 	 } else {
	  ip = req.connection.remoteAddress;
  	}
	
	let country_ip;
    fetch('http://www.geoplugin.net/json.gp?ip=' + country_ip)
    .then(response => response.json())
    .then(json => {country_ip = json.geoplugin_countryName
		

   let cacha;
  	const requi = req.body['g-recaptcha-response']
	const priv = process.env.KEY_PRIVATE;
	const url = `https://www.google.com/recaptcha/api/siteverify?secret=${priv}&response=${requi}`;
	fetch(url, {
    method: 'post',
 	})
    .then((response) => response.json())
    .then((google_response) => {
      if (google_response.success == true) {		
		console.log('Captcha correcto'); 
	
	const sql="INSERT INTO contactos(nombre, email, comentario, fecha ,ip,ubi) VALUES (?,?,?,?,?,?)";
	const nuevos_mensajes=[req.body.nombre, req.body.email, req.body.comentario,fecha,ip, country_ip];
	bd.run(sql, nuevos_mensajes, err =>{
	if (err){return console.error(err.message);}
	else{	res.redirect("/");}	})

	var transporter = nodemailer.createTransport({
		host: "smtp.ethereal.email",
		post: 587,
		secure:false,
		auth: {
			user: procces.env.USSER,
			pass: process.env.PASSW,
		},
	});
	
	var mailOptions = {
		from: procces.env.REMITENTE,
		to: 'example@gmail.com',
		subject: "Programacion II",
		text: 'Task 3',
		html:  `<p>Nombre: ${req.body.nombre}<p>
						<p>Email: ${req.body.email}<p>
						<p>Mensaje: ${req.body.comentario}
						<p>Fecha: ${fecha}
						<p>Ip: ${ip}
						<P>Pais: ${country_ip}` 
	}

	transporter.sendMail(mailOptions, (error,info) => {
			if(error){
				console.log(error.message);
			}
			else{
				console.log("Email Enviado")
			}
	});
	
} 
	
	
	else{	
		res.redirect('/')
		console.log('Resuelve el captcha')
			}	
	

	    }
	) }
);
});






router.get('/',(req,res)=>{
	res.render('index.ejs',{obtener:{}})
});



module.exports = router;








