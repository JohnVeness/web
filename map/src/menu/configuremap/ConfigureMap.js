import React, { useState, useContext, useEffect } from 'react';
import {
    MenuItem,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    Switch,
    Typography,
    ListItemText,
    ListItemIcon,
    AppBar,
    Toolbar,
    Tooltip,
    Divider,
    CircularProgress,
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import AppContext, { defaultConfigureMapStateValues, LOCAL_STORAGE_CONFIGURE_MAP } from '../../context/AppContext';
import RenderingSettingsDialog from '../route/RenderingSettingsDialog';
import headerStyles from '../trackfavmenu.module.css';
import styles from '../configuremap/configuremap.module.css';
import { ReactComponent as StarIcon } from '../../assets/icons/ic_action_favorite.svg';
import { ReactComponent as ResetIcon } from '../../assets/icons/ic_action_reset_to_default_dark.svg';
import { ReactComponent as CloseIcon } from '../../assets/icons/ic_action_close.svg';
import { ReactComponent as TracksIcon } from '../../assets/menu/ic_action_track.svg';
import { ReactComponent as PoiIcon } from '../../assets/icons/ic_action_info_outlined.svg';
import { cloneDeep } from 'lodash';
import EmptyLogin from '../login/EmptyLogin';
import { useTranslation } from 'react-i18next';
import { closeHeader } from '../actions/HeaderHelper';
import { INTERACTIVE_LAYER } from '../../map/layers/CustomTileLayer';
import TracksManager from '../../manager/track/TracksManager';
import SubTitle from '../components/SubTitle';
import PoiCategoriesConfig from './PoiCategoriesConfig';
import gStyles from '../gstylesmenu.module.css';
import capitalize from 'lodash/capitalize';

export const DYNAMIC_RENDERING = 'dynamic';
export const VECTOR_GRID = 'vector_grid';

export default function ConfigureMap() {
    const ctx = useContext(AppContext);

    const { t } = useTranslation();
    const [openSettings, setOpenSettings] = useState(false);
    const [openedTracks, setOpenedTracks] = useState(null);
    const [openPoiConfig, setOpenPoiConfig] = useState(false);

    const heightmaps = ['hillshade', 'slope', 'height'];
    const heightmapsLayers = heightmaps.map((item) => {
        return {
            key: item,
            name: capitalize(item),
            url: `${process.env.REACT_APP_TILES_API_SITE}/heightmap/${item}/{z}/{x}/{y}.png`,
        };
    });

    const handleFavoritesSwitchChange = () => {
        let newConfigureMap = cloneDeep(ctx.configureMapState);
        newConfigureMap.showFavorites = !ctx.configureMapState.showFavorites;
        localStorage.setItem(LOCAL_STORAGE_CONFIGURE_MAP, JSON.stringify(newConfigureMap));
        ctx.setConfigureMapState(newConfigureMap);
    };

    function setIconStyles() {
        let res = [];
        // disabled
        !ctx.configureMapState.showFavorites && res.push(styles.iconDisabled);
        // enabled
        ctx.configureMapState.showFavorites && res.push(styles.iconEnabled);

        return res.join(' ');
    }

    useEffect(() => {
        let savedVisible = JSON.parse(localStorage.getItem(TracksManager.TRACK_VISIBLE_FLAG));
        setOpenedTracks(savedVisible?.open?.length);
    }, [ctx.gpxFiles, ctx.visibleTracks]);

    return (
        <>
            {openPoiConfig ? (
                <PoiCategoriesConfig setOpenPoiConfig={setOpenPoiConfig} />
            ) : (
                <>
                    <AppBar position="static" className={headerStyles.appbar}>
                        <Toolbar className={headerStyles.toolbar}>
                            <IconButton
                                id={'se-configure-map-menu-close'}
                                variant="contained"
                                type="button"
                                className={styles.closeIcon}
                                onClick={() => closeHeader({ ctx })}
                            >
                                <CloseIcon />
                            </IconButton>
                            <Typography id="se-configure-map-menu-name" component="div" className={headerStyles.title}>
                                {t('configure_map')}
                            </Typography>
                            {ctx.loginUser && (
                                <Tooltip key={'reset'} title={t('reset_to_default')} arrow placement="bottom-end">
                                    <span>
                                        <IconButton
                                            id="se-reset"
                                            variant="contained"
                                            type="button"
                                            className={headerStyles.appBarIcon}
                                            onClick={() =>
                                                ctx.setConfigureMapState({ ...defaultConfigureMapStateValues })
                                            }
                                        >
                                            <ResetIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </Toolbar>
                    </AppBar>
                    {!ctx.loginUser && !ctx.develFeatures ? (
                        <EmptyLogin />
                    ) : (
                        <>
                            {ctx.loginUser && (
                                <>
                                    <SubTitle title={'shared_string_show'} />
                                    <MenuItem
                                        id="se-configure-map-menu-poi-categories"
                                        className={styles.item}
                                        onClick={() => {
                                            setOpenPoiConfig(true);
                                        }}
                                    >
                                        <ListItemIcon className={styles.iconEnabled}>
                                            <PoiIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <Typography variant="inherit" noWrap>
                                                    {t('layer_poi')}
                                                </Typography>
                                                {ctx.showPoiCategories.length > 0 && (
                                                    <Typography
                                                        variant="body2"
                                                        className={styles.poiCategoriesInfo}
                                                        noWrap
                                                    >
                                                        {ctx.showPoiCategories.length}
                                                    </Typography>
                                                )}
                                            </div>
                                        </ListItemText>
                                    </MenuItem>
                                    <Divider className={styles.dividerItem} />
                                    <MenuItem className={styles.item} onClick={handleFavoritesSwitchChange}>
                                        <ListItemIcon className={setIconStyles()}>
                                            <StarIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <Typography variant="inherit" noWrap>
                                                    {t('shared_string_favorites')}
                                                </Typography>
                                                <Switch
                                                    id="se-configure-map-menu-favorite-switch"
                                                    checked={ctx.configureMapState.showFavorites}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={handleFavoritesSwitchChange}
                                                />
                                            </div>
                                        </ListItemText>
                                    </MenuItem>
                                    <Divider className={styles.dividerItem} />
                                    <MenuItem
                                        divider
                                        className={styles.item}
                                        onClick={() => ctx.setOpenVisibleMenu(true)}
                                    >
                                        <ListItemIcon className={styles.iconEnabled}>
                                            <TracksIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <Typography variant="inherit" noWrap>
                                                    {t('shared_string_tracks')}
                                                </Typography>
                                                {openedTracks !== 0 && (
                                                    <Typography
                                                        variant="body2"
                                                        className={styles.poiCategoriesInfo}
                                                        noWrap
                                                    >
                                                        {openedTracks?.toString()}
                                                    </Typography>
                                                )}
                                            </div>
                                        </ListItemText>
                                    </MenuItem>
                                </>
                            )}
                            {ctx.develFeatures && (
                                <>
                                    <SubTitle title={'shared_string_appearance'} />
                                    <MenuItem sx={{ ml: 1, mr: 2, mt: 2 }} disableRipple={true}>
                                        <FormControl fullWidth>
                                            <InputLabel id="rendering-style-selector-label">
                                                {t('map_widget_renderer')}
                                            </InputLabel>
                                            <Select
                                                labelid="rendering-style-selector-label"
                                                label={t('map_widget_renderer')}
                                                value={ctx.allTileURLs[ctx.tileURL.key] ? ctx.tileURL.key : ''}
                                                onChange={(e) => {
                                                    ctx.setTileURL(ctx.allTileURLs[e.target.value]);
                                                    if (e.target.value === INTERACTIVE_LAYER) {
                                                        ctx.setRenderingType(DYNAMIC_RENDERING);
                                                    } else if (ctx.renderingType) {
                                                        ctx.setRenderingType(null);
                                                    }
                                                }}
                                            >
                                                {Object.values(ctx.allTileURLs).map((item) => {
                                                    return (
                                                        <MenuItem key={item.key} value={item.key}>
                                                            {item.uiname}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                        </FormControl>
                                        <IconButton sx={{ ml: 1 }} onClick={() => setOpenSettings(true)}>
                                            <Settings fontSize="small" />
                                        </IconButton>
                                    </MenuItem>
                                </>
                            )}
                            <MenuItem className={gStyles.innerTitleItem}>
                                <Typography className={gStyles.innerTitleText} noWrap>
                                    Terrain overlay
                                </Typography>
                                {ctx.processHeightmaps && <CircularProgress size={24} sx={{}} />}
                            </MenuItem>
                            <FormControl sx={{ mx: '22px', mt: 1 }}>
                                <InputLabel>Heightmaps</InputLabel>
                                <Select
                                    labelid="heightmaps-style-selector-label"
                                    label={'Heightmaps'}
                                    defaultValue={'None'}
                                    value={ctx.heightmap?.key || 'None'}
                                    onChange={(e) => {
                                        const selectedHeightmap = heightmapsLayers.find(
                                            (layer) => layer.key === e.target.value
                                        );
                                        ctx.setHeightmap(selectedHeightmap ?? 'none');
                                    }}
                                >
                                    <MenuItem value="None">None</MenuItem>
                                    {Object.values(heightmapsLayers).map((item) => {
                                        return (
                                            <MenuItem key={item.key} value={item.key}>
                                                {item.name}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </>
                    )}
                    {openSettings && <RenderingSettingsDialog setOpenSettings={setOpenSettings} />}
                </>
            )}
        </>
    );
}
