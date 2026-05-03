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

router.route('/p/:playlistId').get(verifyOptionalJWT, getPlaylistById);
router.route('/all/:userId').get(getUserPlaylists);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/create').post(verifyJWT, createPlaylist);
router.route('/p/:playlistId').patch(verifyJWT, updatePlaylist);
router.route('/p/:playlistId').delete(verifyJWT, deletePlaylist);
router.route('/add/p/:playlistId/v/:videoId').patch(verifyJWT, addVideoToPlaylist);
router.route('/remove/p/:playlistId/v/:videoId').patch(verifyJWT, removeVideoFromPlaylist);



export default router;