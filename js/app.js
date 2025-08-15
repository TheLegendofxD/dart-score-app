var game_target_score = 0;
var player_count = 0;
var current_player_id = 0;
var players = [];

class ScoreEntry {
    constructor(difference, total, target_score, was_too_much) {
        this.difference = difference;
        this.total = total;
        this.was_too_much = was_too_much;
        this.target_score = target_score;
    }

    get total_left() {
        return this.target_score - this.total;
    }

    get is_win() {
        return (this.total_left == 0);
    }
}

class Player {
    constructor (name, target_score) {
        this.name = name;
        this.score_table = [];
        this.score = 0;
        this.target_score = target_score;
    }

    get score_left() {
        return this.target_score - this.score;
    }

    get has_won() {
        return (this.score_left == 0);
    }

    recalculate_score() {
        this.score = 0;
        this.score_table.forEach(score_entry => {
            score_entry.target_score = this.target_score;
            score_entry.was_too_much = true;
            if (this.score + score_entry.difference <= this.target_score) {
                this.score += score_entry.difference;
                score_entry.was_too_much = false;
            }
            score_entry.total = this.score;
        });
    }

    add_score(n) {
        let was_too_much = true;
        if (this.score + n <= this.target_score) {
            this.score += n;
            was_too_much = false;
        }
        this.score_table.push(new ScoreEntry(n, this.score, this.target_score, was_too_much));
    }

    edit_score_entry(score_index, new_value) {
        this.score_table[score_index].difference = new_value;
        this.recalculate_score();
    }
}

function shuffle_array(unshuffled_array) {
    /* https://stackoverflow.com/a/46545530 */
    return unshuffled_array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const target_score_elem = document.getElementById("target_score");
const game_table_body = document.getElementById("game_table_body");
const sort_type = document.getElementById('sort_type');
const view_type = document.getElementById('view_type');
let errorModal = new bootstrap.Modal(document.getElementById('errorModal'), {});
let winModal = new bootstrap.Modal(document.getElementById('winModal'), {});
let askNumberModal = new bootstrap.Modal(document.getElementById('askNumberModal'), {});
let continueModal = new bootstrap.Modal(document.getElementById('continueModal'), {});
let askNumberModalPlayerIndex = 0;
let askNumberModalScoreIndex = 0;

function show_error(text) {
    document.getElementById('errorModalBody').innerText = text;
    errorModal.show();
}

function show_win(player_name) {
    document.getElementById('winPlayerName').innerText = player_name;
    winModal.show();
}

function show_asknumber(player_index, score_index = -1) {
    askNumberModalPlayerIndex = player_index;
    askNumberModalScoreIndex = score_index;
    document.getElementById('askNumberPlayerName').innerText = players[player_index].name;
    if (score_index == -1) {
        document.getElementById('askNumberInput').value = '0';
        document.getElementById('askNumberRound').innerText = 'letzten';
    } else {
        document.getElementById('askNumberInput').value = players[player_index].score_table[score_index].difference;
        document.getElementById('askNumberRound').innerText = `${score_index+1}.`;
    }
    askNumberModal.show();
}
document.getElementById('askNumberOkBtn').addEventListener('click', function() {
    let result = document.getElementById('askNumberInput').value;
    if (result == '') {
        show_error('Es muss eine Zahl eingegeben werden :(');
        return;
    }
    if (askNumberModalScoreIndex == -1) {
        players[askNumberModalPlayerIndex].add_score(parseInt(result));
    } else {
        players[askNumberModalPlayerIndex].edit_score_entry(askNumberModalScoreIndex, parseInt(result));
    }
    save_game();
    render_table();
    if(players[askNumberModalPlayerIndex].has_won) {
        show_win(players[askNumberModalPlayerIndex].name);
    }
});

function set_target_score() {
    if (target_score_elem.value == 'custom') {
        document.getElementById("custom_target_score_input_col").style.display = 'block';
        game_target_score = document.getElementById('custom_target_score_input').value;
    } else {
        document.getElementById("custom_target_score_input_col").style.display = 'none';
        game_target_score = target_score_elem.value;
    }
}

function add_player() {
    player_count += 1;
    let doc = new DOMParser().parseFromString(`
    <div class="mb-1" style="display: flex; gap: .5rem" id="pn_elem${current_player_id}">
        <input type="text" class="player_name form-control" maxlength="24" placeholder="Spielername..." id="pn_name${current_player_id}">
        <button class="btn btn-danger p-2 lh-1" style="width: 2.5rem;" onclick="delete_player(${current_player_id})">X</button>
    </div>
    `, "text/html");
    document.getElementById('player_names').appendChild(doc.firstChild);
    document.getElementById('player_count').innerText = player_count;
    current_player_id += 1;
}

function delete_player(player_id) {
    player_count -= 1;
    document.getElementById(`pn_elem${player_id}`).remove();
    document.getElementById('player_count').innerText = player_count;
}

function prepare_table() {
    document.getElementById('sect_setup').style.display = 'none';
    document.getElementById('sect_main').style.display = 'block';

    document.getElementById('game_table_head').innerHTML = '<th scope="col">#</th>';
    players.forEach(player => {
        document.getElementById('game_table_head').innerHTML += `
            <th scope="col">${player.name}</th>
        `;
    });
}

function render_table() {
    let max_rows_needed = 0;

    players.forEach(player => {
        if (player.score_table.length > max_rows_needed) {
            max_rows_needed = player.score_table.length;
        }
    });
    max_rows_needed += 1; /* For controls */

    game_table_body.innerHTML = '';
    let empty_row = '<tr id="row-%1"><td>%2</td>';
    for (let x = 0; x < player_count; x++) {
        empty_row += `<td id="cell-${x}-%1"></td>`;
    }
    for (let y = 0; y < max_rows_needed; y++) {
        game_table_body.innerHTML += empty_row.replaceAll('%1', y).replace('%2', y+1);
    }

    for (let player_index = 0; player_index < players.length; player_index++) {
        const player = players[player_index];
        for (let score_index = 0; score_index < player.score_table.length; score_index++) {
            const score_entry = player.score_table[score_index];
            document.getElementById(`cell-${player_index}-${score_index}`).innerHTML = `
                ${view_type.value == 'add' ? score_entry.total : score_entry.total_left} <small${score_entry.was_too_much ? ' class="text-danger"' : ''}>(${view_type.value == 'add' ? '+' : '-'}${score_entry.difference})</small>
                <button class="btn btn-sm" onclick="show_asknumber(${player_index}, ${score_index})">🖊️</button>
            `;
        }
        if (player.has_won) {
            document.getElementById(`cell-${player_index}-${player.score_table.length}`).innerHTML = `
                🏆 Gewonnen
            `;
        } else {
            document.getElementById(`cell-${player_index}-${player.score_table.length}`).innerHTML = `
                <button class="btn btn-primary" onclick="show_asknumber(${player_index})">+ Punkte hinzufügen</button>
            `;
        }
    }
}

function save_game() {
    let save_data = {};
    save_data.target_score = game_target_score;
    save_data.players = [];
    players.forEach(player => {
        let player_data = {};
        player_data.name = player.name;
        player_data.score_table = [];
        player.score_table.forEach(score_entry => {
            player_data.score_table.push(score_entry.difference);
        });
        save_data.players.push(player_data);
    });
    localStorage.setItem('dart_game', JSON.stringify(save_data));
}

function load_game() {
    let save_data = localStorage.getItem('dart_game');
    if (!(save_data == null || save_data == '')) {
        save_data = JSON.parse(save_data);
    }
    game_target_score = save_data.target_score;
    players = [];

    save_data.players.forEach(player => {
        players.push(new Player(player.name, game_target_score));
        player_count = players.length;
        player.score_table.forEach(score_entry => {
            players[player_count-1].add_score(score_entry);
        });
    });
    prepare_table();
    render_table();
}

function start_game() {
    localStorage.removeItem('dart_game');
    players = [];
    let pn_inputs = document.getElementById('player_names').getElementsByClassName('player_name');
    let alert_shown = false;

    if (pn_inputs.length < 2) {
        show_error('Mindestens 2 Spieler sind notwendig :(');
        return;
    }

    Array.from(pn_inputs).forEach(pn => {
        if (pn.value == '') {
            if (!alert_shown) {
                show_error('Nicht alle Namen sind eingetragen :(');
                alert_shown = true;
            }
            return;
        };
        players.push(new Player(pn.value, game_target_score));
    });
    if (players.length < 2) { return };

    if (document.getElementById('player_order').value == 'random') {
        players = shuffle_array(players);
    }

    prepare_table();
    render_table();
    save_game();
}

target_score_elem.addEventListener('change', set_target_score);
document.getElementById('add_player_btn').addEventListener('click', add_player);
document.getElementById('start_btn').addEventListener('click', start_game);
view_type.addEventListener('change', render_table);
sort_type.addEventListener('change', render_table);
document.getElementById('continueOkBtn').addEventListener('click', load_game);

add_player();
set_target_score();

if (!(localStorage.getItem('dart_game') == null || localStorage.getItem('dart_game') == '')) {
    continueModal.show();
}