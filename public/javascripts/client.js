var socket = io();
var username = '';
var id = '';
var color = getRandomColor();//random kleur bij connecteren
$('#colorpicker').val(color);

//message versturen
$('#chatform').submit(function(){
	if(id !== ''){//gebruiker moet geregistreerd zijn (== id hebben)
		socket.emit('message', $('#inputmessage').val()); //bericht doorsturen
		$('#inputmessage').val(''); //veld leegmaken
	}
	else{
		$('#messages').append($('<li class="text-left">').append('please register first')); //nog niet geregistreerd
	}
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight; //automatisch naar beneden scrollen
	return false;
});

//message ontvangen
socket.on('broadcast', function(msg, i, usr, clr){
	//$('#message').val(msg);
	if(id != i){//andere gebruiker
		$('#messages').append($('<li class="text-left" style="color:'+clr+'">').append(usr + ': ' + msg));
	}
	else{//jezelf
		$('#messages').append($('<li class="text-right" style="color:'+clr+'">').append(msg));
	}
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight; //automatisch naar beneden scrollen

});

//speler wil kaart nemen
$('#drawcard').click(function(){
	if(id !== ''){//moet geregistreerd zijn
		console.log('drawcard');
		socket.emit('drawcard');//kaart vragen aan de server	
	}
	else{
		$('#messages').append($('<li class="text-left">').append('please register first')); //niet geregistreerd
	}
});

//speler wil geen kaarten meer
$('#stand').click(function(){
	if(id !== ''){//moet geregistreerd zijn
		$('#stand').attr('disabled', 'disabled'); //disable de knoppen
		$('#drawcard').attr('disabled', 'disabled');
		console.log('stand');
		socket.emit('stand');//laat het weten aan de server
	}
	else{
		$('#messages').append($('<li class="text-left">').append('please register first')); //niet geregistreerd
	}
});

//speler wil registreren of kleur/username veranderen
$('#registerform').submit(function(){
	username;
	var oldcolor = color;
	testusername = $('#username').val();
	color = $('#colorpicker').val();
	if(testusername == ''){ //de gebruikte username moet minstens 1 caracter bevatten
		$('#messages').append($('<li class="text-right">').append('your name must be at least one character'));
		document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight; //automatisch naar beneden scrollen
	}
	else{
		//nieuwe username
		if(username != testusername){
			console.log('changename');
			socket.emit('checkusername', testusername); //testen op de server of hij uniek is
		}
		//nieuw color
		if(id !== '' && oldcolor != color){
			console.log('changecolor');
			socket.emit('changedcolor', color); //laten weten aan server
			document.getElementById(username).style.color = color; //kleur in lijst van gebruikers aanpassen
			$('#inputmessage').focus();
		}		
	}
	return false;
});

//er is een nieuwe gebruiker geregistreerd
socket.on('registered', function(usr, clr){
	$('#messages').append($('<li class="text-left" style="color:'+clr+'">').append(usr + ': ' + 'has entered the chat'));
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight;
	$('#people').append($('<li class="text-left" id="'+usr+'" style="color:'+clr+'">').append(usr));
});

//de te testen username is goedgekeurd
socket.on('goodusername', function(usr){
	if(username != ''){//de gebruiker had al een username
		document.getElementById(username).id = usr;
		document.getElementById(usr).innerHTML = usr;
		$('#inputmessage').focus();
	}
	username = usr;
	if(id === ''){// de gebruiker is nog niet geregistreerd
		console.log('register goodusername');
		console.log('registering '+id);
		socket.emit('register', username, color); //registreren bij server, met geteste username
	}
});

//de te testen username is niet goedgekeurd
socket.on('badusername', function(usr){
	$('#messages').append($('<li class="text-left">').append('username (' + usr + ') is already taken'));
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight;
});

//deze gebruiker is geregistreerd en krijgt dus een id
socket.on('setid', function(i){
	id = i;
	console.log('id set = ' + id);
	$('#inputmessage').focus();
});

//een andere gebruiker is van username veranderd
socket.on('usernamechange', function(oldusr, newusr, clr){
	$('#messages').append($('<li class="text-left" style="color:'+clr+'">').append(oldusr + ': has changed his name to ' + newusr));
	document.getElementById(oldusr).id = newusr;
	document.getElementById(newusr).innerHTML = newusr;
});

//een andere gebruiker is van color veranderd
socket.on('colorchange', function(usr, clr){
	$('#messages').append($('<li class="text-left" style="color:'+clr+'">').append(usr + ': has changed his color'));
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight;
	document.getElementById(usr).style.color = clr;
});

//een andere gebruiker is vertrokken of gedisconnect
socket.on('left', function(usr, clr){
	$('#messages').append($('<li class="text-left" style="color:'+clr+'">').append(usr + ': has left'));
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight;
	var li = document.getElementById(usr);
	li.parentNode.removeChild(li);
});

//dit wordt gestuurd bij het connecteren: alle geregistreerde gebruikers
socket.on('registeredusers', function(users){
	console.log('add registered users' + users);
	for(key in users){
		console.log('add user');
		$('#people').append($('<li class="text-left" id="'+key+'" style="color:'+users[key]+'">').append(key));
	}
});

//de kaart die de gebruiker heeft getrokken
socket.on('drawn', function(card){
	$('#owncards').append($('<img src="images/'+card+'" class="img-responsive col-xs-3" alt="'+card+'"/>'));
});

//de gebruiker heeft een kaart proberen trekken, maar is busted
socket.on('busted', function(card, points){
	$('#owncards').append($('<img src="images/'+card+'" class="img-responsive col-xs-3" alt="'+card+'"/>'));
	$('#drawcard').attr('disabled', 'disabled');
	$('#stand').attr('disabled', 'disabled');
	$('#messages').append($('<li class="text-left">').append('you\'re busted ('+points+' points)'));
});

//het spel is gedaan en er is een nieuw spel begonnen
socket.on('gameover', function(dealerpoints, ownpoints){
	if(ownpoints <= 21){
		if(ownpoints <= 0){
			$('#messages').append($('<li class="text-left">').append('game started'));
		}
		else{
			if(dealerpoints >= ownpoints){
				$('#messages').append($('<li class="text-left">').append('you lost! ('+ownpoints+' points < '+dealerpoints+')'));
			}
			else{
				$('#messages').append($('<li class="text-left">').append('you won! ('+ownpoints+' points > '+dealerpoints+')'));
			}	
		}
	}
	document.getElementById("scrollermessages").scrollTop = document.getElementById("scrollermessages").scrollHeight;
	$('#drawcard').removeAttr('disabled');
	$('#stand').removeAttr('disabled');
	$('#owncards > img').remove();
	$('#dealer > img').remove();
});

//de deler heeft een kaart getrokken
socket.on('dealer', function(card){
	console.log('dealer');
	if(id !== ''){
		$('#dealer').append($('<img src="images/'+card+'" class="img-responsive col-xs-3" alt="'+card+'"/>'));
	}
});

//kiest random kleur
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}