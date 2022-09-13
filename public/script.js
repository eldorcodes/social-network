$(document).ready(function(){
    let root = $('#root');
    // init socket
    let socket = io();

    socket.on('connect',function(){
        console.log('Server is connected.');
         ///// listen to messages event
    socket.on('messages',function(data){
        console.log(data)
        // clear chat room
        $('#chatRoom').empty()
        // continue rendering chats in chat room
        let senderChat = data.filter(chat => {
            return chat.senderId === currentUserId && chat.receiverId === otherUserId
        })

        console.log('SENDER CHAT',senderChat)

        let receiverChat = data.filter(chat => {
            return chat.senderId === otherUserId && chat.receiverId === currentUserId
        })
        console.log('RECEIVER CHAT',receiverChat)

        if (senderChat.length !== 0) {
            senderChat[0].messages.forEach(message => {
                /// create div element with class of right-message
                let rightMessageDiv = $('<div></div>');
                rightMessageDiv.addClass('right-message');
                /// create div for date
                let rightMessageDiv2 = $('<div></div>');
                rightMessageDiv2.addClass('right-message');
                // create a paragraph for a message
                let messagePtag = $('<p></p>');
                messagePtag.addClass('right-msg');

                if (message.senderMessage !== '') {
                    messagePtag.text(message.senderMessage);
                    messagePtag.css('backgroundColor','blue');
                    messagePtag.css('color','white');
                }
                ////// create small tag for date ////////////
                let date = $('<small></small>');
                date.addClass('date');
                if (message.senderMessage !== '') {
                    date.text(moment(message.date).startOf('seconds').fromNow())
                }else{
                    date.text('')
                }
                // append div and p
                rightMessageDiv.append(messagePtag)
                rightMessageDiv2.append(date)
                // cretae div for receiver message
                let leftMessageDiv = $('<div></div>');
                leftMessageDiv.addClass('left-message');
                // create p for left message
                let leftMessageTag = $('<p></p>');
                leftMessageTag.addClass('left-msg');
                ///date//////
                let leftDateDiv = $('<div></div>');
                leftDateDiv.addClass('left-message');
                let smallTag = $('<small></small>');
                smallTag.addClass('date');
                /////////////////////////////////////////
                if (message.receiverMessage !== '') {
                    leftMessageTag.text(message.receiverMessage)
                    leftMessageTag.css('backgroundColor','purple')
                    leftMessageTag.css('color','white')
                    smallTag.text(moment(message.date).startOf('seconds').fromNow())
                }else{
                    smallTag.text('')
                }

                leftMessageDiv.append(leftMessageTag);
                leftDateDiv.append(smallTag);
                /////////////////////append to main div//////////////
                if (message.senderMessage) {
                    $('#chatRoom').append(rightMessageDiv)
                    $('#chatRoom').append(rightMessageDiv2)
                }
                if (message.receiverMessage) {
                    $('#chatRoom').append(leftMessageDiv)
                    $('#chatRoom').append(leftDateDiv)
                }
            })
        }
        ////////////check receiver message
        if (receiverChat.length !== 0) {
            receiverChat[0].messages.forEach(message => {
                // create a div element for right message
                let rightMessageDiv = $('<div></div>');
                rightMessageDiv.addClass('right-message');
                // create a div for date
                let rightMessageDiv2 = $('<div></div>');
                rightMessageDiv2.addClass('right-message');
                // create a p for message
                let messagePtag = $('<p></p>');
                messagePtag.addClass('right-msg');
                /////////////////////////////////
                if (message.receiverMessage !== '') {
                    messagePtag.text(message.receiverMessage);
                    messagePtag.css('backgroundColor','blue');
                    messagePtag.css('color','white');
                }
                // create small tag for date
                let date = $('<small></small>');
                date.addClass('date');

                if (message.receiverMessage !== '') {
                    date.text(moment(message.date).startOf('seconds').fromNow())
                }else{
                    date.text('')
                }
                // append div and p
                rightMessageDiv.append(messagePtag)
                rightMessageDiv2.append(date)
                /// create a div for receiver message
                let leftMessageDiv = $('<div></div>');
                leftMessageDiv.addClass('left-message');
                // create left message p element
                let leftMessageTag = $('<p></p>');
                leftMessageTag.addClass('left-msg');
                // create a left div for receiver date
                let leftDateDiv = $('<div></div>');
                leftDateDiv.addClass('left-message');
                // create small tag for receiver date
                let smallTag = $('<small></small>');
                smallTag.addClass('date');
                /////////////////////////////////
                if (message.senderMessage !== '') {
                    leftMessageTag.text(message.senderMessage)
                    leftMessageTag.css('backgroundColor','purple')
                    leftMessageTag.css('color','white')
                }
                if (message.senderMessage !== '') {
                    smallTag.text(moment(message.date).startOf('seconds').fromNow())
                }else{
                    smallTag.text('')
                }
          
                leftMessageDiv.append(leftMessageTag);
                leftDateDiv.append(smallTag);
                /////////////////////app to main div//////////////
                if (message.receiverMessage) {
                    $('#chatRoom').append(rightMessageDiv)
                    $('#chatRoom').append(rightMessageDiv2)
                }
                if (message.senderMessage) {
                    $('#chatRoom').append(leftMessageDiv)
                    $('#chatRoom').append(leftDateDiv)
                }
            })
        }
        $('#chatRoom').animate({scrollTop:10000},800)
    })
    /////////////CHAT ROOM ENDS HERE //////////////////
    });

    let userID = $('#userID').val();
    console.log('USER ID IS ', userID);

    if (userID) {
        socket.emit('currentUser',{userID})

    socket.on('loggedUser',function(loggedUser){
        console.log('USer found', loggedUser)
    })
    }

    //////// listen to all users event
    socket.on('allUsers',function(users){
        let usersDiv = $('#users');
        users.forEach((user) => {
            console.log(user)
            let h1 = $('<h1></h1>');
            h1.text(user.username);
            let p = $('<p></p>');
            p.text(user.email);

            usersDiv.append(h1)
            usersDiv.append(p)
        })
    })
    //////////////////////////////
    ////////// CHAT ROOM PROCESS ///////////////////////
    let otherUserId = $('#otherUserId').val();
    let currentUserId = $('#currentUserId').val();

    console.log('CURRENT USER ID is -----', currentUserId)

    ////// send message button event handler
    let form = $('#form');
    form.on('submit',function(event){
        event.preventDefault()
        let input = $('#message').val();
        console.log(input)
        socket.emit('newMessage',{
            message:input,
            currentUserId,
            otherUserId
        })
        $('#message').val('')
    });
 /// FETCH INPUT VALUES AND SEND POST TO SERVER 
 let postForm = $('#post-form');

 postForm.on('submit',function(event){
    event.preventDefault()
    $('#posts').empty()
    let postInput = $('#post-input').val()
    let currentUserId = $('#currentUserId').val()
    
    // send post to server
    socket.emit('newPost',{postInput,currentUserId});
    $('#post-input').val('');
 })
   /// listen to posts event
   socket.on('posts',function(posts){
    $('#posts').empty()
    let reversedArray = posts.reverse()
    console.log('POSTS ----- ', reversedArray)
    reversedArray.forEach(post => {
        console.log(post)
        let h1 = $('<h1></h1>');
        h1.text(post.username);

        let p = $('<p></p>');
        p.text(post.body);

        let pDate = $('<p></p>');
        pDate.text(moment(post.date).startOf('seconds').fromNow());

        let icon = $('<i></i>');
        let span = $('<span></span>');
        span.text(post.comments.length);
        span.attr('style','margin-left:5px;');
       icon.append(span);
        icon.addClass('far fa-comment-alt');
        
        let CommentRoute = $('<a></a>');
        CommentRoute.attr('href',`/comments/${post._id}`);

        CommentRoute.append(icon);

        let likeIcon = $('<i></i>');
        likeIcon.text(post.likes.length);
        /// find out like icon 
       if (post.likes.length === 0) {
        likeIcon.addClass('far fa-thumbs-up');
        likeIcon.on('click',function(){
            socket.emit('addLike',{
                postId:post._id,
                userID:currentUserId
            })
        })
       } else {
        post.likes.forEach((like) => {
            if (like._id !== currentUserId) {
                likeIcon.addClass('far fa-thumbs-up');
                likeIcon.on('click',function(){
                    socket.emit('addLike',{
                        postId:post._id,
                        userID:currentUserId
                    })
                })
                
            }else{
                likeIcon.addClass('fas fa-thumbs-up');
                likeIcon.on('click',function(){
                    socket.emit('removeLike',{
                        postId:post._id,
                        userID:currentUserId
                    })
                })
            } 
        })
       }
      

        let hr = $('<hr/>');

        $('#posts').append(h1)
        $('#posts').append(p)
        $('#posts').append(pDate)
        $('#posts').append(likeIcon)
        $('#posts').append(CommentRoute)
        $('#posts').append(hr)
    }) 
   })
   //////// HANDLE COMMENT EVENT
   let commentForm = $('#comment-form');

   commentForm.on('submit',function(event){
    event.preventDefault();
    
    let comment = $('#comment');
    let userId = $('#currentUserUID').val()
    let postId = $('#postId').val()
    // emit comment
    socket.emit('newComment',{
        body:comment.val(),
        commentUserId:userId,
        postId:postId
    })
    let postID = $('#postId').val();
    socket.emit('findThisPost',postID);
    comment.val('')
   
   })
   // display all comments
   let postID = $('#postId').val();
   if (postID) {
    socket.emit('findThisPost',postID);
   }

   // listen to post comments event
   socket.on('postComments',function(post){
    console.log('POST COMMENTS ---- ',post);
    $('#comments').empty()
    post.comments.forEach((comment) => {
        let div = $('<div></div>');
    div.attr('style','flex-direction: row;display:flex')
    let i = $('<i></i>');
    i.addClass('fas fa-user-secret commentIcon');
    let p = $('<p></p>');
    p.attr('id','comment-username');
    p.text(comment.username);
    let pBody = $('<p></p>');
    pBody.text(comment.body);
    pBody.attr('id','comment-body');
    let dateP = $('<p></p>');
    dateP.text(moment(comment.date).startOf('seconds').fromNow())
    // create a column
    let column = $('<div></div>');
    column.addClass('comment-column');

    column.append(p);
    column.append(pBody);
    column.append(dateP)

    div.append(i);
    div.append(column);

    $('#comments').append(div);
    })
    $('#comments').animate({scrollTop:10000},800)
   })
});