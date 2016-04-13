package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"sort"

	"github.com/gorilla/mux"
//	"github.com/jinzhu/gorm"
)

type handlerError struct {
	Error error
	Message string
	Code int
}

type Song struct {
//  gorm.Model
  Title  string `json:"title"  `
  Artist string `json:"artist" `
  Votes  int    `json:"votes"  `
  Id     int    `json:"id"     `
}

type ByVote []Song

func (slice ByVote) Len() int {
    return len(slice)
}

func (slice ByVote) Less(i, j int) bool {
    return slice[i].Votes < slice[j].Votes;
}

func (slice ByVote) Swap(i, j int) {
    slice[i], slice[j] = slice[j], slice[i]
}

var songs = make([]Song, 0)

type handler func(w http.ResponseWriter, r *http.Request) (interface{}, *handlerError)

func (fn handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	response, err := fn(w, r)

	// check for errors
	if err != nil {
		log.Printf("ERROR: %v\n", err.Error)
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Message), err.Code)
		return
	}
	if response == nil {
		log.Printf("ERROR: response from method is nil\n")
		http.Error(w, "Internal server error. Check the logs.", http.StatusInternalServerError)
		return
	}

	// turn the response into JSON
	bytes, e := json.Marshal(response)
	if e != nil {
		http.Error(w, "Error marshalling JSON", http.StatusInternalServerError)
		return
	}

	// send the response and log
	w.Header().Set("Content-Type", "application/json")
	w.Write(bytes)
	log.Printf("%s %s %s %d", r.RemoteAddr, r.Method, r.URL, 200)
}

func listSongs(w http.ResponseWriter, r *http.Request) (interface{}, *handlerError) {
	sort.Sort(sort.Reverse(ByVote(songs)))
	return songs, nil
	// return playlist.Songs, nil
}

func getSong(w http.ResponseWriter, r *http.Request) (interface{}, *handlerError) {
	// mux.Vars grabs variables from the path
	param := mux.Vars(r)["id"]
	id, e := strconv.Atoi(param)
	if e != nil {
		return nil, &handlerError{e, "Id should be an integer", http.StatusBadRequest}
	}
	s, index := getSongById(id)

	if index < 0 {
		return nil, &handlerError{nil, "Could not find song " + param, http.StatusNotFound}
	}

	return s, nil
}

func parseSongRequest(r *http.Request) (Song, *handlerError) {
	// the book payload is in the request body
	data, e := ioutil.ReadAll(r.Body)
	if e != nil {
		return Song{}, &handlerError{e, "Could not read request", http.StatusBadRequest}
	}

	// turn the request body (JSON) into a book object
	var payload Song
	e = json.Unmarshal(data, &payload)
	if e != nil {
		return Song{}, &handlerError{e, "Could not parse JSON", http.StatusBadRequest}
	}

	return payload, nil
}

func addSong(w http.ResponseWriter, r *http.Request) (interface{}, *handlerError) {
	payload, e := parseSongRequest(r)
	if e != nil {
		return nil, e
	}

	// it's our job to assign IDs, ignore what (if anything) the client sent
	payload.Id = getNextId()
	songs = append(songs, payload)

	// we return the book we just made so the client can see the ID if they want
	return payload, nil
}

func updateSong(w http.ResponseWriter, r *http.Request) (interface{}, *handlerError) {
	payload, e := parseSongRequest(r)
	if e != nil {
		return nil, e
	}

	_, index := getSongById(payload.Id)
	songs[index] = payload
	return make(map[string]string), nil
}

func removeSong(w http.ResponseWriter, r *http.Request) (interface{}, *handlerError) {
	param := mux.Vars(r)["id"]
	id, e := strconv.Atoi(param)
	if e != nil {
		return nil, &handlerError{e, "Id should be an integer", http.StatusBadRequest}
	}
	// this is jsut to check to see if the book exists
	_, index := getSongById(id)

	if index < 0 {
		return nil, &handlerError{nil, "Could not find entry " + param, http.StatusNotFound}
	}

	// remove a song from the list
	songs = append(songs[:index], songs[index+1:]...)
	//playlist.Songs = append(playlist.Songs[:index], songs[index+1:]...)
	return make(map[string]string), nil
}

func getSongById(id int) (Song, int) {
	for i, s := range songs {
		if s.Id == id {
			return s, i
		}
	}
	return Song{}, -1
}

var id = -1

// increments id and returns the value
func getNextId() int {
	id = id + 1
	return id
}

func main() {
	// command line flags
	port := flag.Int("port", 8080, "port to serve on")
	dir := flag.String("directory", "web/", "directory of web files")
	flag.Parse()

	// handle all requests by serving a file of the same name
	fs := http.Dir(*dir)
	fileHandler := http.FileServer(fs)

	// setup routes
	router := mux.NewRouter()
	router.Handle("/", http.RedirectHandler("/static/", 302))
	router.Handle("/songs", handler(listSongs)).Methods("GET")
	router.Handle("/songs", handler(addSong)).Methods("POST")
	router.Handle("/songs/{id}", handler(getSong)).Methods("GET")
	router.Handle("/songs/{id}", handler(updateSong)).Methods("POST")
	router.Handle("/songs/{id}", handler(removeSong)).Methods("DELETE")
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static", fileHandler))
	http.Handle("/", router)

	// bootstrap some data
	songs = append(songs, Song{"Hey Jude", "The Beatles", 1, getNextId()})
	songs = append(songs, Song{"Train in Vain", "The Clash", 1, getNextId()})
	songs = append(songs, Song{"Hello", "Adele", 4, getNextId()})
	songs = append(songs, Song{"Sweet Child O'Mine", "Guns 'n Roses", 2, getNextId()})

	log.Printf("Running on port %d\n", *port)

	addr := fmt.Sprintf("127.0.0.1:%d", *port)
	// this call blocks -- the progam runs here forever
	err := http.ListenAndServe(addr, nil)
	fmt.Println(err.Error())
}