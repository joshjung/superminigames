import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { index,
  show,
  create,
  clone,
  play,
  highscore,
  viewHighscore,
  clearHighscores,
  update,
  updatePassword,
  destroy,
  addAsset,
  deleteAsset} from './controller'
import { schema } from './model'
export Game, { schema } from './model'

const router = new Router();
const { title,
  image,
  assets,
  gameLoopFnText,
  ownerUserId,
  instructions,
  description,
  published,
  publishedDate,
  publishedVersion,
  publishedTitle,
  publishedInstructions,
  publishedDescription,
  publishedGameLoopFnText,
  history,
  originalGameId,
  clonedFromGameId,
  lib,
  engineId,
  highscores,
  playcount } = schema.tree;

router.get('/',
  query(),
  index);

router.get('/:id/:addFields',
  show);

router.get('/:id',
  show);

router.post('/',
  token({ required: true }),
  body({ title,
    image,
    description,
    published,
    publishedDate,
    publishedTitle,
    publishedInstructions,
    publishedDescription,
    publishedGameLoopFnText,
    gameLoopFnText,
    ownerUserId,
    instructions,
    originalGameId,
    clonedFromGameId,
    history,
    lib,
    engineId
  }),
  create);

router.post('/clone',
  token({ required: true }),
  body({ id: {type: String}, userId: {type: String} }),
  clone);

router.post('/play',
  body({ id: {type: String}, userId: {type: String} }),
  play);

router.post('/highscore',
  token({ required: true }),
  body({
    id: {type: String},
    userId: {type: String},
    score: {type: Number},
    time: {type: Number},
    name: {type: String},
    screenshot: {type: String}}),
  highscore);

router.get('/highscore/:gameId/:userId/:timestamp',
  viewHighscore);

router.post('/clearHighscores',
  token({ required: true }),
  body({ id: {type: String}, userId: {type: String}}),
  clearHighscores);

router.put('/:id',
  token({ required: true }),
  body({ title,
    image,
    assets,
    description,
    published,
    publishedDate,
    publishedVersion,
    publishedTitle,
    publishedInstructions,
    publishedDescription,
    publishedGameLoopFnText,
    gameLoopFnText,
    ownerUserId,
    instructions,
    lib,
    engineId
  }),
  update);

router.delete('/:id',
  token({ required: true }),
  destroy);

router.post('/:gameId/asset',
  token({ required: true }),
  addAsset);

router.delete('/:gameId/asset/:assetId',
  token({ required: true }),
  deleteAsset);

export default router;
