import React, { useContext, useEffect, useState, } from 'react'
import { Text, View, TextInput, Image, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import styles from "../../styles/components/chatStyleSheet"
import { Colors, globalStyles } from '../../styles/globalStyleSheet';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/ChatNotificationContext';
import { Message } from './Message';
import useWebSocket, { ReadyState } from "react-use-websocket";
import { FlashList } from "@shopify/flash-list";
import { Entypo, Ionicons } from '@expo/vector-icons';
import { Char } from '../../types';
import { WSBaseURL } from '../../config';
import { handleExpiryDate } from '../controllers/post';


export const Chat = ({ navigation, route }) => {
    const { user, accessToken } = React.useContext(AuthContext)
    const { setChatIsOpen } = useContext(NotificationContext);

    useEffect(() => {
        if (!user) {
            navigation.navigate('LoginScreen')
        }
        // on mounting
        setChatIsOpen(true)

        // on unmounting
        return () => {
            setChatIsOpen(false)
        }
    }, [])

    const [message, setMessage] = React.useState("");
    const [messageHistory, setMessageHistory] = React.useState<object[]>([]);
    const [start, setStart] = useState(30)
    const [end, setEnd] = useState(40)
    const [empty, setEmpty] = useState(false)
    const [loading, setLoading] = useState(false)
    const [endReached, setEndReached] = useState(false)
    const [inputHeight, setInputHeight] = useState(0)
    const [initiated, setInitiated] = useState(false)

    const namesAlph = [route.params.user1, route.params.user2].sort();
    const conversationName = `${namesAlph[0]}__${namesAlph[1]}`
    const reciever = namesAlph[0] === user['username'] ?
        namesAlph[1] : namesAlph[0]

    useEffect(() => {
        navigation.setOptions({
            title: reciever,
        })
    }, [])

    const handleSend = () => {
        if (message) {
            sendJsonMessage({
                type: "chat_message",
                message,
                name: user['username']
            });
            setMessage("");
            setInputHeight(30)
        }
    }

    const loadMessages = () => {
        if (!initiated) return

        if (end) {
            setLoading(true)
            sendJsonMessage({
                type: `render__${start}_${end}`,
                name: user['username']
            });
            setStart(end)
            setEnd(end + 10)
        } else console.log("end!!");
    }

    const { readyState, sendJsonMessage } = useWebSocket(user ? `${WSBaseURL}chats/${conversationName}/` : null, {
        queryParams: {
            token: user ? accessToken : ""
        },
        onOpen: () => {
            console.log("WebSocket connected!");
        },
        onClose: () => {
            console.log("WebSocket disconnected!");
        },
        onMessage: (e) => {
            const data = JSON.parse(e.data);
            switch (data.type) {
                case 'chat_message_echo':
                    setMessageHistory([data.message, ...messageHistory]);
                    sendJsonMessage({ type: "read_messages" });
                    break;
                case "last_30_messages":
                    setInitiated(true)
                    if (data.messages.length === 0) {
                        setEmpty(true)
                    } else setMessageHistory(data.messages);
                    break
                case "render_x_to_y_messages":
                    setMessageHistory([...messageHistory, ...data.messages]);
                    setLoading(false)
                    break
                case "limit_reached":
                    setLoading(false)
                    if (!empty && !endReached) {
                        setEnd(0)
                        setEndReached(true)
                    }
                    break
                default:
                    console.error("Unknown message type!");
                    break;
            }
        }
    });

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated"
    }[readyState];

    useEffect(() => {
        if (connectionStatus === "Open") {
            sendJsonMessage({
                type: "read_messages"
            });
        }

        if (connectionStatus === "Open" && route.params.msg) {
            if (route.params.post) {
                sendJsonMessage({
                    type: "chat_message",
                    message: route.params.post,
                    name: user['username']
                });
                route.params.post = ''
            }

            const msg = route.params.msg
            sendJsonMessage({
                type: "chat_message",
                message: msg,
                name: user['username']
            });
            route.params.msg = ''
        }
    }, [connectionStatus, sendJsonMessage]);

    useEffect(() => {
        if (messageHistory.length > 0) setEmpty(false)
    }, [messageHistory])

    const handlePress = (
        title: string,
        imagesLink: string,
        postedOn: Number,
        postedBy: Number,
        description: string,
        postId: Number,
        username: string,
        expiryDate: string,
        distance: number | null,
        logistics: Char[],
        categories: Char[],
        diet: Char[],
        accessNeeds: Char,
        postalCode: string,
        type: Char
    ) => {
        type === "r" ?
            navigation.navigate('RequestDetailsScreen', {
                title,
                imagesLink,
                postedOn,
                postedBy,
                description,
                postId,
                username,
                expiryDate,
                distance,
                logistics,
                categories,
                diet,
                accessNeeds,
                postalCode,
            })
            :
            navigation.navigate('OfferDetailsScreen', {
                title,
                imagesLink,
                postedOn,
                postedBy,
                description,
                postId,
                username,
                expiryDate,
                distance,
                logistics,
                categories,
                diet,
                accessNeeds,
                postalCode,
            })
    }

    const Post = ({ item }) => {
        const content = JSON.parse(item.content)

        return (
            <TouchableOpacity testID='Chat.postPrev' onPress={() => handlePress(
                content.title,
                content.images,
                content.postedOn,
                content.postedBy,
                content.description,
                content.postId,
                content.username,
                content.expiryDate,
                content.distance,
                content.logistics,
                content.categories,
                content.diet,
                content.accessNeeds,
                content.postalCode,
                content.type
            )}>
                <View testID='Chat.postCont' style={user['username'] === item.to_user['username'] ? styles.postMsgContainerIn : styles.postMsgContainerOut}>
                    <View
                        testID='Chat.postMsg'
                        style={user['username'] === item.to_user['username'] ?
                            styles.postMsgIn : styles.postMsgOut}>
                        <View testID='Chat.postMsgCont' style={styles.postMsgCont}>
                            {<Image
                                testID='Chat.postMsgImg'
                                style={styles.postMsgImg}
                                source={content.images ? { uri: content.images } : require('../../assets/Post.png')}
                            />}
                            <View>
                                <View testID='Chat.postMsgSubCont' style={styles.postMsgSubCont}>
                                    <Text
                                        testID='Chat.postMsgTitle'
                                        style={[styles.postMsgTitle, {
                                            color: user['username'] === item.to_user['username'] ?
                                                Colors.dark : Colors.white
                                        }]}
                                        ellipsizeMode="tail"
                                        numberOfLines={1}
                                    >{content.title}</Text>
                                    <View testID='Chat.postMsgLocation' style={[styles.postMsgLocation,
                                    (user['username'] === content.username) ? { opacity: 0, height: 0 } : {}]}>
                                        <Ionicons name='location-outline' size={13}
                                            testID='Chat.postMsgLocationIcon'
                                            style={{
                                                marginRight: 4,
                                                color: user['username'] === item.to_user['username'] ?
                                                    Colors.dark : Colors.white
                                            }} />
                                        {/* Placeholder distance away */}
                                        <Text testID='Chat.postMsgDistance' style={[globalStyles.Small2,
                                        {
                                            color: user['username'] === item.to_user['username'] ?
                                                Colors.dark : Colors.white
                                        }]}>{content.distance ? content.distance.toFixed(1) : 'x'} km away</Text>
                                    </View>
                                </View>
                                <View testID='Chat.postMsgNeedBy' style={[styles.postMsgNeedBy]}>
                                    <Text testID='Chat.postMsgTag' style={globalStyles.Tag}>{handleExpiryDate(content.expiryDate, content.type)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    const renderItem = ({ item }) => {
        if (item.content.startsWith('{')) {
            try {
                JSON.parse(item.content)
                return <Post item={item} />
            } catch (error) { }
        }
        return <Message key={item.id} message={item}></Message>
    }


    return (
        <View testID='Chat.container' style={{ flex: 1, backgroundColor: 'white' }}>
            <Text>The WebSocket is currently {connectionStatus}</Text>
            {(!empty && messageHistory.length === 0) && <ActivityIndicator animating size="large" color={Colors.dark} />}
            {empty && !loading && <Text testID='Chat.noMsgs' style={styles.noMsgs}>No Messages</Text>}
            <FlashList
                renderItem={renderItem}
                data={messageHistory}
                onEndReached={loadMessages}
                onEndReachedThreshold={0.3}
                inverted={true}
                estimatedItemSize={100}
                testID='Chat.messagesList'
                ListFooterComponent={endReached ?
                    <Text style={{ fontSize: 15, alignSelf: 'center', marginTop: 10 }}
                    >End Reached</Text> : <></>}
            />
            <View testID='Chat.chatBar' style={[styles.chatBar, inputHeight > 50 ? { height: 69 + (inputHeight - 69 + 25) } : { height: 69 }]}>
                <Entypo testID='Chat.chatCameraIcon' name="camera" size={26} color="black" style={styles.chatCameraIcon} />
                <View testID='Chat.chatInputContainer' style={styles.chatInputContainer}>
                    <TextInput
                        testID='Chat.chatInput'
                        value={message}
                        style={[styles.chatInput, { height: inputHeight }]}
                        placeholder="Type a message"
                        placeholderTextColor="#656565"
                        onChangeText={setMessage}
                        onSubmitEditing={handleSend}
                        maxLength={250}
                        multiline={true}
                        onContentSizeChange={event => {
                            setInputHeight(event.nativeEvent.contentSize.height);
                        }}
                        numberOfLines={3}
                    />
                </View>
                <Pressable style={styles.sendBtn} onPress={handleSend}>
                    <Text style={[globalStyles.Button, { color: Colors.offWhite, marginHorizontal: 10 }]}>Send</Text>
                </Pressable>
            </View>
            {/* {Platform.OS != 'web' &&
                <FlashList
                    inverted={true}
                    data={messageHistory}
                    renderItem={renderItem}
                    onEndReached={loadMessages}
                    onEndReachedThreshold={0.3}
                />}
            {Platform.OS === 'web' &&
                <FlatList
                    inverted={true}
                    data={messageHistory}
                    renderItem={renderItem}
                    onEndReached={loadMessages}
                    onEndReachedThreshold={0.3}
                />} */}
            {/* <TextInput
                value={message}
                placeholder="Message"
                placeholderTextColor="#000000"
                onChangeText={setMessage}
                onSubmitEditing={handleSend}
                maxLength={250}
            /> */}
        </View>
    )
}

export default Chat
