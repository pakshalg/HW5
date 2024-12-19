/*
Name: Pakshal Gandhi
Student ID: 01772844
Last Date Modified: 12/18/24
js.js

Description: This script implements a simple, one line Scrabble game using jQuery and jQuery UI for drag-and-drop functionality. It loads the dictionary, tile data, and available letters, then initializes the tiles and game board. Players can drag and drop tiles to form words, validate them against the dictionary, and calculate the score based on tile values and special board cells. The game allows players to submit words, update their score, redraw letters, and reset for a fresh start.
*/


$(function () {
    let tilesData = [];
    let validWords = [];
    let availableTiles = [];
    const noOfLetters = 7;
    let gameScore = 0;

    const specialCells = { 3: 'Double_Letter_Score', 6: 'Double_Word_Score' };

    async function loadTilesData(callback) {
        try {
            tilesData = await $.getJSON('pieces.json');
        } catch (error) {
            console.log("An error has occurred: ", error);
        }
    }

    async function loadLetters() {
        Object.keys(tilesData["pieces"]).forEach(letter => {
            for (let i = 0; i < tilesData["pieces"][letter].amount; i++) {
                availableTiles.push(letter);
            }
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function initializeTiles() {
        availableTiles = shuffleArray(availableTiles);

        let selectedTiles = availableTiles.slice(0, noOfLetters);
        selectedTiles.forEach(letter => {
            letter = letter.toUpperCase()
            const tile = $('<img>').attr({
                src: `Scrabble_Tiles/Scrabble_Tile_${letter}.jpg`,
                alt: letter,
                class: 'tile'
            }).data('value', tilesData["pieces"][letter].value);
            $('#tile-rack').append(tile);
        });

        $('.tile').draggable({
            revert: 'invalid',
            stack: '.tile',
            start: function (event, ui) {
                $(ui.helper).css('opacity', '0.5');
            },
            stop: function (event, ui) {
                $(ui.helper).css('opacity', '1');
            }
        });
    }

    function initializeBoard() {
        for (let i = 0; i < 7; i++) {
            const cell = $('<div>').addClass('board-cell').appendTo('#scrabble-board').addClass('cell-'+i);
            if (specialCells[i]) {
                cell.addClass(specialCells[i]);
                cell.css('background-image', `url(Scrabble_Tiles/Scrabble_Tile_Blank_${specialCells[i]}.jpg)`);
            }
            else {
                cell.css('background-image', `url(Scrabble_Tiles/Scrabble_Tile_Blank.jpg)`);
            }
        }

        $('.board-cell').droppable({
        accept: function (draggable) {
            if ($(this).has('img').length === 0 && $(draggable).hasClass('tile')) {
                return true;
            }
            return false;
        },
        activeClass: 'highlight',
        hoverClass: 'hoverCls',
        drop: function (event, ui) {
            $(ui.draggable).detach().css({ top: 0, left: 0 }).appendTo(this);
        }
    });

        $('#tile-rack').droppable({
            accept: '.tile',
            activeClass: 'highlight',
            hoverClass: 'hoverCls',
            drop: function (event, ui) {
                $(ui.draggable).detach().css({ top: 0, left: 0 }).appendTo(this);
                ui.draggable.draggable('option', 'revert', false);
            }
        });
    }

    async function loadDictionary() {
        $.get('words.txt', function (data) {
            validWords = data.split('\n');
            console.log("Dictionary loaded with " + validWords.length + " words.");
        });
    }

    function calculateScore() {
        let word = '';
        $('#scrabble-board .board-cell').each(function () {
            const img = $(this).find('img');
            if (img.length > 0) {
                word += img.attr('alt');
            }
            else {
                word += '.'
            }
        });

        word = word.replace(/^\.*|\.*$/g, '');
        if (word == '') {
            $('#validation-message').text("Please construct a word" + word).css('color', 'red');
        }
        else if (word.length != 1 && validWords.includes(word.toLowerCase())) {
            let totalScore = 0;
            let doubleWord = false;
            $('#scrabble-board .board-cell img').each(function () {
                const cell = $(this).parent();
                let tileScore = $(this).data('value');
                console.log(tileScore)
                if (tileScore && cell.hasClass('Double_Word_Score')) {
                    doubleWord = true;
                } else if (tileScore && cell.hasClass('Double_Letter_Score')) {
                    tileScore *= 2;
                }
                totalScore += tileScore;
                let ltr = $(this).attr('alt');
                let indexToRemove = availableTiles.indexOf(ltr)
                if (indexToRemove !== -1) {
                    availableTiles.splice(indexToRemove, 1);
                }
            });
            if (doubleWord) {
                totalScore *= 2;
            }
            $('#validation-message').text("Congratulations! You found the word: " + word).css('color', 'green');
            $('#score-display').text("Current Score: " + totalScore);
            gameScore += totalScore;
            return true
        } else {
            $('#validation-message').text("Invalid word: " + word).css('color', 'red');
            resetTiles();
            return false;
        }
    }

    function resetTiles() {
        $('#scrabble-board .board-cell img').each(function () {
            $(this).detach().css({ top: 0, left: 0 }).appendTo('#tile-rack');
        });
    }

    function resetGame() {
        $('#scrabble-board .board-cell').empty();
        $('#score-display').text('Current Score: 0');
        $('#tile-rack').empty();
        $('#validation-message').text("");
        initializeTiles();
    }

    $('#submit-word').on('click', function () {
        let result = calculateScore();
        if (result == true) setTimeout(() => resetGame(), 2000);
        $('#game-score-display').text('Game Score: ' + gameScore);
    });

    $('#reset-game').on('click', function () {
        resetGame();
        gameScore = 0;
        $('#game-score-display').text('Game Score: 0');
    });

    $('#refresh-rack').on('click', function(){
        resetGame();
    })

    async function start() {
        await loadDictionary();
        await loadTilesData();
        await loadLetters()
        await initializeTiles();
        initializeBoard();
    }
    start();


});