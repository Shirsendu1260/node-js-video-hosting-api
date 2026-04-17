import { Router } from 'express';
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from '../controllers/playlist.controller.js';
import { verifyJWT, verifyOptionalJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

router.route('/playlist/:playlistId').get(verifyOptionalJWT, getPlaylistById);
router.route('/channel/playlist/:userId').get(getUserPlaylists);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/playlist/create').post(verifyJWT, createPlaylist);
router.route('/playlist/:playlistId').patch(verifyJWT, updatePlaylist);
router.route('/playlist/:playlistId').delete(verifyJWT, deletePlaylist);
router.route('/playlist/add/:playlistId/:videoId').patch(verifyJWT, addVideoToPlaylist);
router.route('/playlist/remove/:playlistId/:videoId').patch(verifyJWT, removeVideoFromPlaylist);



export default router;