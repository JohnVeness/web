import { useContext, useState, useMemo } from 'react';
import AppContext from '../../../context/AppContext';
import {
    Alert,
    Box,
    Button,
    IconButton,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Typography,
} from '@mui/material';
import L from 'leaflet';
import contextMenuStyles from '../../styles/ContextMenuStyles';
import { Cancel } from '@mui/icons-material';
import PointManager from '../../../context/PointManager';
import TracksManager from '../../../context/TracksManager';
import wptTabStyle from '../../styles/WptTabStyle';
import { confirm } from '../../../dialogs/GlobalConfirmationDialog';
// import { measure } from '../../../util/Utils';
import _ from 'lodash';

// distinct component
const WaypointRow = ({ point, index, ctx }) => {
    const NAME_SIZE = 30;
    const stylesWpt = wptTabStyle();

    const [showMore, setShowMore] = useState(false);

    function showPoint(point) {
        ctx.setSelectedWpt(point);
        ctx.setSelectedGpxFile((o) => ({ ...o, showPoint: point }));
    }

    function getLength(point) {
        return point.layer.options?.desc && point.layer.options.address ? 15 : 30;
    }

    function getName(point) {
        let name = point.layer.options?.title;
        if (name) {
            if (name.length > NAME_SIZE) {
                return point.layer.options?.title.substring(0, NAME_SIZE);
            } else {
                return name;
            }
        }
    }

    function hasInfo(wpt) {
        return wpt.layer.options?.desc !== undefined || wpt.layer.options?.address !== undefined || wpt.wpt.category;
    }

    function showWithInfo(point) {
        return (
            <>
                <ListItemIcon
                    className={stylesWpt.icon}
                    dangerouslySetInnerHTML={{ __html: point.layer.options.icon.options.html + '' }}
                />
                <ListItemText sx={{ ml: '-35px !important' }}>
                    <Typography component={'span'} variant="inherit" noWrap>
                        {getName(point)}
                        {point.layer.options?.title?.length > NAME_SIZE && (
                            <ListItemIcon style={{ marginRight: ' -25px' }}>{'...'}</ListItemIcon>
                        )}
                        <br />
                        <Typography component={'span'} variant="caption">
                            {point.wpt.category}
                        </Typography>
                        {point.wpt.category && (point.layer.options?.address || point.layer.options?.desc) && (
                            <ListItemIcon style={{ marginLeft: '5px', marginRight: ' -25px' }}>{' • '}</ListItemIcon>
                        )}
                        <Typography component={'span'} variant="caption" style={{ wordWrap: 'break-word' }}>
                            {showMore
                                ? point.layer.options?.desc
                                : point.layer.options?.desc?.substring(0, getLength(point))}
                            {point.layer.options?.desc?.length > getLength(point) && (
                                <ListItemIcon style={{ marginRight: ' -25px' }}>{'...'}</ListItemIcon>
                            )}
                        </Typography>
                        {point.layer.options?.address && point.layer.options?.desc && (
                            <ListItemIcon style={{ marginLeft: '5px', marginRight: ' -25px' }}>{' • '}</ListItemIcon>
                        )}
                        <Typography component={'span'} variant="caption" style={{ wordWrap: 'break-word' }}>
                            {showMore
                                ? point.layer.options?.address
                                : point.layer.options?.address?.substring(0, getLength(point))}
                            {point.layer.options?.address?.length > getLength(point) && (
                                <ListItemIcon onClick={() => setShowMore(!showMore)}>
                                    {showMore ? ' ...less' : ' ...more'}
                                </ListItemIcon>
                            )}
                        </Typography>
                    </Typography>
                </ListItemText>
            </>
        );
    }

    function showOnlyName(point) {
        return (
            <>
                <ListItemIcon
                    className={stylesWpt.iconOnlyName}
                    dangerouslySetInnerHTML={{ __html: point.layer.options.icon.options.html + '' }}
                />
                <ListItemText sx={{ ml: '-35px !important' }}>
                    <Typography variant="inherit" noWrap component="span">
                        {getName(point)}
                        {point.layer.options?.title?.length > NAME_SIZE && (
                            <ListItemIcon style={{ marginRight: ' -25px' }}>{'...'}</ListItemIcon>
                        )}
                    </Typography>
                </ListItemText>
            </>
        );
    }

    const row = useMemo(
        () => (
            <MenuItem key={'marker' + index} divider onClick={() => showPoint(point)}>
                {hasInfo(point) ? showWithInfo(point) : showOnlyName(point)}
                <ListItemAvatar>
                    {ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK && (
                        <IconButton
                            sx={{ mr: 1 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                PointManager.deleteWpt(index, ctx);
                            }}
                        >
                            <Cancel fontSize="small" />
                        </IconButton>
                    )}
                </ListItemAvatar>
            </MenuItem>
        ),
        [
            index,
            point.wpt?.lat,
            point.wpt?.lon,
            point.wpt?.category,
            point.layer?.options?.desc,
            point.layer?.options?.title,
            point.layer?.options?.address,
            point.layer?.options?.icon?.options?.html,
            ctx.currentObjectType,
        ]
    );

    return row;
};

export default function WaypointsTab() {
    const ctx = useContext(AppContext);

    const stylesMenu = contextMenuStyles();

    const [openWptAlert, setOpenWptAlert] = useState(true);

    function deleteAllWpts() {
        confirm({
            ctx,
            text: 'Delete all waypoints?',
            callback: () => {
                ctx.selectedGpxFile.wpts = [];
                ctx.selectedGpxFile.updateLayers = true;
                TracksManager.updateState(ctx);
                ctx.setSelectedGpxFile({ ...ctx.selectedGpxFile });
            },
        });
    }

    // TODO
    // function addWaypoint() {
    //     ctx.selectedGpxFile.addWpt = true;
    //     ctx.setSelectedGpxFile({...ctx.selectedGpxFile});
    // }

    function getLayers() {
        if (ctx.selectedGpxFile.layers && Object.keys(ctx.selectedGpxFile.layers).length > 0) {
            return ctx.selectedGpxFile.layers.getLayers();
        }
        if (ctx.selectedGpxFile.gpx) {
            return ctx.selectedGpxFile.gpx.getLayers();
        }
        return [];
    }

    function getSortedPoints() {
        const wpts = [];

        if (ctx.selectedGpxFile.wpts) {
            const layers = getLayers();
            const wptsMap = Object.fromEntries(ctx.selectedGpxFile.wpts.map((p) => [p.lat + ',' + p.lon, p]));

            layers.forEach((layer) => {
                if (layer instanceof L.Marker) {
                    const coord = layer.getLatLng();
                    const key = coord.lat + ',' + coord.lng;
                    const wpt = wptsMap[key];
                    wpt && wpts.push({ wpt, layer });
                }
            });
        }

        const az = (a, b) => (a > b) - (a < b);

        return wpts.sort((a, b) => {
            const aName = a.wpt.name;
            const bName = b.wpt.name;

            const aCat = a.wpt.category;
            const bCat = b.wpt.category;

            if (aCat !== bCat) {
                return az(aCat, bCat);
            }

            return az(aName, bName);
        });
    }

    /**
     * wpt.icon (direct process is better)
     * wpt.category (1st key)
     * wpt.name (2nd key)
     * wpt.desc
     */

    // function getSortedGroups(points) {

    // }

    // 1st level of speedup
    // avoid JSON.stringify on every render
    // use track.name/wpts as dependence key
    const pointsChangedString = useMemo(() => {
        // Note: run of JSON.stringify is ~2x times slower than getSortedPoints
        return ctx.selectedGpxFile.name + JSON.stringify(ctx.selectedGpxFile.wpts);
    }, [ctx.selectedGpxFile, ctx.currentObjectType]);

    // 2nd level of speedup
    // avoid re-creation of group/rows
    // depends on previosly memoized key
    const waypoints = useMemo(() => {
        const allPoints = getSortedPoints();
        return (
            <Box className={stylesMenu.item} minWidth={ctx.infoBlockWidth}>
                {ctx.selectedGpxFile.wpts &&
                    allPoints.map((point, index) => (
                        <WaypointRow key={'wpt' + index} point={point} index={index} ctx={ctx} />
                    ))}
            </Box>
        );
    }, [pointsChangedString]);

    return (
        <>
            {ctx.createTrack && ctx.selectedGpxFile?.wpts && !_.isEmpty(ctx.selectedGpxFile.wpts) && (
                <Button variant="contained" className={stylesMenu.button} onClick={deleteAllWpts} sx={{ mb: 2 }}>
                    Clear waypoints
                </Button>
            )}

            {openWptAlert && ctx.createTrack && (!ctx.selectedGpxFile.wpts || _.isEmpty(ctx.selectedGpxFile.wpts)) && (
                <Alert
                    sx={{ mt: 2 }}
                    severity="info"
                    onClose={() => {
                        setOpenWptAlert(false);
                    }}
                >
                    Use the context menu to add a waypoint...
                </Alert>
            )}
            {waypoints}
        </>
    );
}
