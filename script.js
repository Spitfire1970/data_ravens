// intentionally leaving the api key just to make testing easier!
const tmdb_api_key = 'fd61319c6e50dacaea41f8d99fab1189';
const tmdb_base_url = 'https://api.themoviedb.org/3';

const chat_messages = document.getElementById('chat-messages');
const user_input = document.getElementById('user-input');
const send_button = document.getElementById('send-button');

send_button.addEventListener('click', handle_input);
user_input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handle_input();
    }
});

async function handle_input() {
    const message = user_input.value.trim();
    if (!message) return;

    append_message(message, 'user');
    user_input.value = '';
    user_input.focus();

    const loading_id = show_loading();

    try {
        // enable to see loading animation
        // await new Promise(r => setTimeout(r, 2000));
        const movie = await fetch_recommendation(message);
        remove_loading(loading_id);

        if (movie) {
            append_message(`Here's a movie recommendation in the ${message} genre:\n\n🎬 <strong class="font-bold">${movie.title}</strong>\n\n${movie.overview}`, 'bot');
        } else {
            append_message(`I couldn't find any movies for the genre "${message}". Please try another one!`, 'bot');
        }
    } catch (error) {
        remove_loading(loading_id);
        append_message("Sorry, something went wrong. Please check your connection and try again.", 'bot');
        console.error('Error:', error);
    }
}

// not that this way allows the user to inject some harmful js so this is not ideal but for this assigment we can ignore this
function append_message(message, sender) {
    const message_wrapper = document.createElement('div');
    message_wrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    const message_div = document.createElement('div');
    // accent color for user messages
    message_div.className = `p-3 rounded-lg max-w-[85%] sm:max-w-[80%] shadow-sm ${sender === 'user' ? 'bg-accent text-white' : 'bg-accent-bot text-gray-800'}`;

    message_div.innerHTML = `<p class="whitespace-pre-wrap">${message}</p>`;

    message_wrapper.appendChild(message_div);
    chat_messages.appendChild(message_wrapper);
    chat_messages.scrollTop = chat_messages.scrollHeight;
}

function show_loading() {
    const loading_id = `loading-${Date.now()}`;
    const loading_wrapper = document.createElement('div');
    loading_wrapper.id = loading_id;
    loading_wrapper.className = 'flex justify-start';

    const loading_div = document.createElement('div');
    loading_div.className = 'p-3 rounded-lg bg-white shadow-sm';

    // pulsating dots loading animation
    loading_div.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        </div>
    `;

    loading_wrapper.appendChild(loading_div);
    chat_messages.appendChild(loading_wrapper);
    chat_messages.scrollTop = chat_messages.scrollHeight;
    return loading_id;
}

function remove_loading(loading_id) {
    const loading_element = document.getElementById(loading_id);
    if (loading_element) loading_element.remove();
}

async function fetch_recommendation(genre) {
    try {
        const genre_response = await fetch(`${tmdb_base_url}/genre/movie/list?api_key=${tmdb_api_key}`);
        if (!genre_response.ok) return null;

        const genre_data = await genre_response.json();
        const genre_obj = genre_data.genres.find(g => g.name.toLowerCase() === genre.toLowerCase());
        if (!genre_obj) return null;

        // only filter by genre and sort by popularity
        const movie_response = await fetch(
            `${tmdb_base_url}/discover/movie?api_key=${tmdb_api_key}&with_genres=${genre_obj.id}&sort_by=popularity.desc`
        );
        if (!movie_response.ok) return null;
        const movie_data = await movie_response.json();

        if (!movie_data.results || movie_data.results.length === 0) return null;

        // pick a random movie from the top 20 results
        const popular_movies = movie_data.results.slice(0, 20);
        const random_index = Math.floor(Math.random() * popular_movies.length);
        const movie = popular_movies[random_index];

        return {
            title: movie.title, // there is also the original title but i'm just gonna show the english title
            overview: movie.overview
        };

    } catch (error) {
        console.error('error fetching from TMDB:', error);
        return null;
    }
}