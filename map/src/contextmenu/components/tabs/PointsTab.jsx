import {Box, IconButton, ListItemAvatar, ListItemIcon, ListItemText, MenuItem, Typography} from "@mui/material";
import React, {useContext} from "react";
import {Cancel, ViewHeadline} from "@mui/icons-material";
import AppContext from "../../../context/AppContext";
import Utils from "../../../util/Utils";
import TracksManager from "../../../context/TracksManager";
import {DragDropContext, Draggable, Droppable} from "@hello-pangea/dnd";


const PointsTab = ({width}) => {

    const ctx = useContext(AppContext);

    function showPointOnMap(point) {
        ctx.selectedGpxFile.showPoint = point;
        ctx.setSelectedGpxFile({...ctx.selectedGpxFile});
    }

    function deletePoint(index) {
        let currentTrack = ctx.localTracks.find(t => t.name === ctx.selectedGpxFile.name);
        if (currentTrack) {
            if (currentTrack.hasOnlyTrk) {
                let lengthSum = 0;
                for (let track of currentTrack.tracks) {
                    if (lengthSum > index) {
                        lengthSum += track.length;
                        break;
                    } else {
                        let ind = index - lengthSum;
                        track.points.splice(ind, 1);
                    }
                }
            }
        }
        updateTrack(currentTrack);
        TracksManager.saveTracks(ctx.localTracks);
    }

    const onDragEnd = result => {
        if (!result.destination) {
            return;
        }
        reorder(result.source.index, result.destination.index);
    }

    const reorder = (startIndex, endIndex) => {
        let currentTrack = ctx.localTracks.find(t => t.name === ctx.selectedGpxFile.name);
        const [removed] = currentTrack.points.splice(startIndex, 1);
        currentTrack.points.splice(endIndex, 0, removed);
        currentTrack.trk.forEach(t => {
            let removed;
            t.forEach(s => {
                let ind = s.points.findIndex(p => p.id === startIndex);
                if (ind !== -1) {
                    removed = s.points.splice(ind, 1);
                }
            })
            t.forEach(s => {
                let ind = s.points.findIndex(p => p.id === endIndex);
                s.points.splice(ind, 0, removed[0]);
            })
        })
        updateTrack(currentTrack);
        TracksManager.saveTracks(ctx.localTracks);
    }

    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: "none",
        background: isDragging ? '#fbc73a' : "white",
        color: isDragging ? "white" : "black",
        borderBottom: '0.5px solid gray',
        ...draggableStyle
    });

    function updateTrack(currentTrack) {
        currentTrack.tracks.forEach(track => {
            track.points = Utils.getPointsDist(track.points);
        })
        ctx.setLocalTracks([...ctx.localTracks]);
        //ctx.setSelectedGpxFile(Object.assign({}, currentTrack));
    }

    const PointRow = () => ({point, index}) => {
        return (
            <Draggable key={index} draggableId={index + ' row'} index={index}>
                {(provided, snapshot) => (
                    <MenuItem ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              key={index} divider onClick={() => showPointOnMap(point)}
                              style={getItemStyle(
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                              )}
                    >
                        <ListItemIcon>
                            <ViewHeadline fontSize="small"/>
                        </ListItemIcon>
                        <ListItemText>
                            <Typography variant="inherit" noWrap>
                                Point - {index + 1}<br/>
                                {point.distanceFromStart === 0 ? "start" : Math.round(point.distanceFromStart) + " m"}
                            </Typography>
                        </ListItemText>
                        <ListItemAvatar>
                            <IconButton x={{mr: 1}} onClick={(e) => {
                                e.stopPropagation();
                                deletePoint(index)
                            }}>
                                <Cancel fontSize="small"/>
                            </IconButton>
                        </ListItemAvatar>
                    </MenuItem>
                )}
            </Draggable>)
    }

    return (<DragDropContext onDragEnd={onDragEnd}><Box width={width}>
        <Droppable droppableId="droppable-1">
            {(provided) => (
                <div ref={provided.innerRef}
                     style={{maxHeight: '35vh', overflow: 'auto'}}
                     {...provided.droppableProps}>
                    {ctx.selectedGpxFile && TracksManager.getActivePoints(ctx.selectedGpxFile).map((point, index) => {
                        return PointRow()({point: point, index: index});
                    })}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </Box>
    </DragDropContext>);
};

export default PointsTab;