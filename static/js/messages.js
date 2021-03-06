(function() {
    function handleCommand(cmd) {
        if(cmd[0] != '/') {
            return false;
        }

        // Scrub scrub scrub
        var val = cmd;
        val = val.replace(/\s+/g, ' ');
        val = val.replace(/(^\s*|\s*$)/g, '');

        var parts = val.slice(1).split(' ');
        cmd = parts[0];
        var args = parts.slice(1).join(' ');

        server.command(cmd, args);
        return true;
    }

    function notify(msg) {
        var n = $('#notification');
        var all = n.children('.message');

        if(all.length > 1) {
            all.first().remove();
        }

        var el = $('<div class="message">' + msg + '</div>');
        n.append(el);
        el.addClass('open');

        setTimeout(function() {
            el.removeClass('open');
        }, 1000);
    }

    function printMessage(msg, name, format) {
        var messages = $('#messages');
        var chat = $('#chat');
        var closed = chat.is('.closed');

        if(messages.children().length > 50) {
            messages.children().first().remove();
        }

        format = format || function(msg, name) {
            return '<div class="' + name + '">' +
                '<span class="name">&lt;' + name + '&gt;</span> ' +
                msg + '</div>';
        };

        // Scrub the name. The message part is trusted from the
        // server.
        name = name.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        if(name == 'server' || name == 'server-intro') {
            msg = msg.replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/ /g, '&nbsp;')
                .replace(/\n/g, '<br />');

        }

        var formatted = format(msg, name);
        messages.append(formatted);
        messages[0].scrollTop = 100000;

        if(closed && name != 'server-intro') {
            notify(formatted);
        }
    }

    function toggleChat() {
        var chat = $('#chat');
        chat.toggleClass('closed');

        if(chat.is('.closed')) {
            chat.find('.type input').blur();
        }
        else {
            $('#messages').height(renderer.height - $('#chat .type').height());
            chat.find('.type input').focus();
        }
    }

    function closeChat() {
        var chat = $('#chat');
        chat.addClass('closed');
        chat.find('.type input').blur();        
    }

    function init() {
        var el = $('#message-input');

        input.on('F1', function(e) {
            toggleChat();
            e.preventDefault();
            e.stopPropagation();
        });

        el.on('keydown', function(e) {
            if(e.keyCode != 112) {
                e.stopPropagation();
            }

            // For some weird reason pressing ESC kills the websocket
            if(e.keyCode == 27) {
                e.preventDefault();
            }


            if(e.keyCode == 13) {
                var val = el.val();

                if(val !== '') {
                    if(!handleCommand(val)) {
                        server.sendMessage(val);
                    }
                    el.val('');
                }
            }
        });

        server.on('message', function(obj) {
            printMessage(obj.message, obj.name);
        });

        server.on('cmdRes', function(obj) {
            switch(obj.method) {
            case 'users':
            case 'names':
                printMessage('Users: '  + obj.res.join(' '), 'server');
                break;
            case 'me':
                printMessage(obj.res, '', function(msg, name) {
                    return '<div class="me">' + msg + '</div>';
                });
            }
        });
    }

    window.messages = {
        init: init,
        notify: notify,
        toggleChat: toggleChat,
        closeChat: closeChat
    };
})();