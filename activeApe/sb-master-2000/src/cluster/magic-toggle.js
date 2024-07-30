        let isDraggable = false;

        document.getElementById('toggle-drag').addEventListener('click', () => {
            isDraggable = !isDraggable;
            document.querySelectorAll('.bot').forEach(bot => {
                if (isDraggable) {
                    bot.style.cursor = 'move';
                    bot.onmousedown = function (event) {
                        let shiftX = event.clientX - bot.getBoundingClientRect().left;
                        let shiftY = event.clientY - bot.getBoundingClientRect().top;

                        function moveAt(pageX, pageY) {
                            const container = document.getElementById('momentum-trader-bot');
                            const containerRect = container.getBoundingClientRect();
                            const botRect = bot.getBoundingClientRect();

                            let newLeft = pageX - shiftX;
                            let newTop = pageY - shiftY;

                            // Ensure the bot stays within the container
                            if (newLeft < containerRect.left) newLeft = containerRect.left;
                            if (newTop < containerRect.top) newTop = containerRect.top;
                            if (newLeft + botRect.width > containerRect.right) newLeft = containerRect.right - botRect.width;
                            if (newTop + botRect.height > containerRect.bottom) newTop = containerRect.bottom - botRect.height;

                            bot.style.left = newLeft - containerRect.left + 'px';
                            bot.style.top = newTop - containerRect.top + 'px';

                            // Snap to other bots
                            document.querySelectorAll('.bot').forEach(otherBot => {
                                if (otherBot !== bot) {
                                    const otherRect = otherBot.getBoundingClientRect();
                                    if (Math.abs(newLeft - otherRect.right) < 10) {
                                        bot.style.left = otherRect.right - containerRect.left + 'px';
                                    }
                                    if (Math.abs(newLeft + botRect.width - otherRect.left) < 10) {
                                        bot.style.left = otherRect.left - botRect.width - containerRect.left + 'px';
                                    }
                                    if (Math.abs(newTop - otherRect.bottom) < 10) {
                                        bot.style.top = otherRect.bottom - containerRect.top + 'px';
                                    }
                                    if (Math.abs(newTop + botRect.height - otherRect.top) < 10) {
                                        bot.style.top = otherRect.top - botRect.height - containerRect.top + 'px';
                                    }
                                }
                            });
                        }

                        function onMouseMove(event) {
                            moveAt(event.pageX, event.pageY);
                        }

                        document.addEventListener('mousemove', onMouseMove);

                        bot.onmouseup = function () {
                            document.removeEventListener('mousemove', onMouseMove);
                            bot.onmouseup = null;
                        };
                    };

                    bot.ondragstart = function () {
                        return false;
                    };
                } else {
                    bot.style.cursor = 'default';
                    bot.onmousedown = null;
                    bot.ondragstart = null;
                }
            });
        });

        document.querySelectorAll('.bot-btn.open').forEach(button => {
            button.addEventListener('click', (event) => {
                const bot = event.target.closest('.bot');
                bot.classList.toggle('fullscreen');
            });
        });