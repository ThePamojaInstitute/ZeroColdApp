import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, FlatList } from "react-native";
import { useState } from "react";
import { axiosInstance } from "../../config";
import { useAlert } from "../context/Alert";
import { FlashList } from "@shopify/flash-list"


const PostRenderer = ({ type }) => {
    const { dispatch: alert } = useAlert()
    const [noPosts, setNoPosts] = useState(true)
    const [postIndex, setPostIndex] = useState(0)
    const [loadNumPosts, setLoadNumPosts] = useState(1) //Change if number of posts to load changes

    const [array, setArray] = useState([])

    const loadPosts = async () => {
        const json = JSON.stringify({ postIndex: postIndex, postType: type })
        const res = await axiosInstance.post("posts/requestPostsForFeed", json, {
        }).then((res) => {
            if (res.data.length == 2 && postIndex == 0) {
                console.log('No posts available')
                alert!({ type: 'open', message: 'No posts available', alertType: 'info' })
            }
            else if (res.data.length == 2 && postIndex > 0) {
                console.log('All posts displayed')
                alert!({ type: 'open', message: 'All posts displayed', alertType: 'info' })
            }
            else {
                try {
                    setNoPosts(false)
                    setPostIndex(postIndex + loadNumPosts)

                    for (let i = 0; i < loadNumPosts; i++) {
                        const data = JSON.parse(res.data)[i].fields
                        // console.log(data)
                        const postedOnDate = new Date(data.postedOn * 1000).toLocaleDateString('en-US')
                        const postedByDate = new Date(data.postedBy * 1000).toLocaleDateString('en-US')

                        let newPost = {
                            title: data.title,
                            imagesLink: data.images,
                            postedOn: postedOnDate,
                            postedBy: postedByDate,
                            description: data.description,
                            postType: data.postType
                        }
                        setArray(arr => [...arr, newPost])
                    }
                }
                catch (e) {
                    console.log("Fewer than " + loadNumPosts + " new posts")
                }
            }
        })
    }

    //TODO: Show more post details (description, option to message, etc)on press
    const onPress = () => {

    }

    const Post = ({ title, imagesLink, postedOn, postedBy, description, postType }) => {
        return (
            <TouchableOpacity style={styles.container} onPress={() => {
                // console.log({ title, imagesLink, postedOn, postedBy, description, postType });
            }}>
                <Image
                    style={styles.image}
                    source={{
                        uri:
                            imagesLink ?
                                imagesLink :
                                "https://images.pexels.com/photos/1118332/pexels-photo-1118332.jpeg?auto=compress&cs=tinysrgb&w=600"
                    }}
                />
                <View style={styles.subContainer}>
                    <Text style={styles.titleText}>{title}</Text>
                    <View style={{ padding: 8 }}>
                        {/* Placeholder profile picture
                        <Image source={{uri: }}> */}
                        <Text>User</Text>
                    </View>
                    <Text style={styles.quantityText}>Quantity: </Text>
                </View>
                <View>
                    <Text style={styles.needByText}>
                        Posted On: {postedOn}{'\n'}
                        Need by: {postedBy}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    const renderItem = ({ item }) => {
        return (
            // <View>
            <Post
                title={item.title}
                imagesLink={item.imagesLink}
                postedOn={item.postedOn}
                postedBy={item.postedBy}
                description={item.description}
                postType={item.postType}
            />

        )
    }

    return (
        <View style={{ backgroundColor: '#F3F3F3', height: "80%", flex: 1 }}>
            {/* Temporary refresh button for web */}
            <TouchableOpacity onPress={loadPosts}>
                <Text style={[styles.refreshBtnText]}>Refresh</Text>
            </TouchableOpacity>
            {noPosts ? <Text style={styles.noPostsText}>No posts available</Text> : <></>}
            <FlashList
                renderItem={renderItem}
                data={array}
                onEndReached={loadPosts}
                onEndReachedThreshold={0.3}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                estimatedItemSize={125}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // marginBottom: 100,
        padding: 10,
        flexDirection: 'row',
    },
    subContainer: {
        flex: 1,
        padding: 10,
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 15,
    },
    titleText: {
        fontWeight: 'bold',
        fontSize: 24,
    },
    quantityText: {
        fontSize: 14,
    },
    needByText: {
        flex: 1,
        textAlign: 'right',
        alignSelf: 'flex-end',
        marginTop: 62
    },
    noPostsText: {
        fontSize: 36,
        padding: 15,
    },
    refreshBtnText: {
        color: 'blue',
        fontSize: 24,
        padding: 15,
    }
})

export default PostRenderer