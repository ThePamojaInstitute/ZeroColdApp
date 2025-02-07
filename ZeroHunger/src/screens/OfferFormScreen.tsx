import React, { useContext, useEffect, useRef, useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, Text, View, Platform } from "react-native";
import styles from "../../styles/screens/postFormStyleSheet"
import { Colors, Fonts, globalStyles } from "../../styles/globalStyleSheet";
import ImagePicker from "../components/ImagePicker";
import DatePicker from "../components/DatePicker"
import Quantity from "../components/Quantity";
import {
    DIETPREFERENCES,
    FOODCATEGORIES,
    createPost,
    getCategory,
    getDiet
} from "../controllers/post";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/Alert";
import { handleImageUpload } from "../controllers/post";
import Logistics from "../components/Logistics";
import { intitializePreferences } from "../controllers/preferences";
import FoodFilters from "../components/FoodFilters";
import { useTranslation } from "react-i18next";
import { Char, PostFromData } from "../../types";
import { Controller, useForm } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FormCustomHeader } from "../components/headers/FormCustomHeader";
import moment from "moment";


export const OfferFormScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext)
    const { dispatch: alert } = useAlert()
    const { t, i18n } = useTranslation();
    const {
        control,
        handleSubmit,
        setValue,
        setError,
        formState: { errors },
        clearErrors,
    } = useForm<PostFromData>();

    const [imagesURIs, setImagesURIs] = useState([])
    const [base64Images, setBase64Images] = useState([])
    const [desc, setDesc] = useState("")
    const [loading, setLoading] = useState(false)
    const [logistics, setLogistics] = useState<Char[]>([])
    const [defaultPostalCode, setDefaultPostalCode] = useState('')
    const [useDefaultPostal, setUseDefaultPostal] = useState(false)
    const [accessNeeds, setAccessNeeds] = useState('')
    const [categories, setCategories] = useState<Char[]>([])
    const [diet, setDiet] = useState<Char[]>([])
    const [expiryDate, setExpiryDate] = useState<string>()
    const [dataSourceCords, setDataSourceCords] = useState([]);
    const [errField, setErrField] = useState<'' | 'categories' | 'expiryDate'>("")

    const scrollView = useRef(null)

    const scrollTo = (viewName: string) => {
        scrollView.current.scrollTo({
            x: 0,
            y: dataSourceCords[viewName],
            animated: true,
        })
    }

    useEffect(() => {
        intitializePreferences(setLogistics, setDefaultPostalCode, setDiet)
    }, [])

    useEffect(() => {
        if (errors.title) scrollTo('title')
    }, [errors.title])

    useEffect(() => {
        if (errors.postalCode && !errors.title) {
            scrollTo('postalCode')
        }
    }, [errors.postalCode])

    useEffect(() => {
        if (Platform.OS === 'web') {
            navigation.setOptions({
                header: () => (
                    <FormCustomHeader
                        navigation={navigation}
                        title={"Offer"}
                        defaultPostalCode={defaultPostalCode}
                        setUseDefaultPostal={setUseDefaultPostal}
                        useDefaultPostal={useDefaultPostal}
                        handlePress={handlePress}
                        handleSubmit={handleSubmit}
                        setError={setError}
                    />
                )
            })
        } else {
            navigation.setOptions({
                title: "Offer Food",
                headerTitleAlign: 'center',
                headerStyle: {
                    backgroundColor: Colors.Background
                },
                headerLeft: () => (
                    <TouchableOpacity
                        testID="Offer.cancelBtn"
                        onPress={() => navigation.navigate('HomeScreen')}
                        style={Platform.OS === 'web' ? { marginLeft: 10 } : {}}
                    >
                        <Text testID="Offer.cancelBtnLabel" style={styles.formCancelBtn}>Cancel</Text>
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        testID="Offer.createBtn"
                        onPress={() => {
                            if (useDefaultPostal && !defaultPostalCode) {
                                setError('postalCode', {
                                    type: 'validation',
                                    message: "You don't have a default postal code. Please enter a valid one"
                                })
                                setUseDefaultPostal(false)
                                return
                            }

                            handleSubmit(handlePress)()
                        }}
                        style={globalStyles.navDefaultBtn}
                    >
                        <Text testID="Offer.createBtnLabel" style={globalStyles.defaultBtnLabel}>Post</Text>
                    </TouchableOpacity>
                )
            })
        }
    }, [imagesURIs, base64Images, desc, logistics, defaultPostalCode, useDefaultPostal, accessNeeds, categories, diet, expiryDate])

    useEffect(() => {
        if (errField === 'categories') {
            setErrField('')
        }
    }, [categories])

    // useEffect(() => {
    //     if (errField === 'expiryDate') {
    //         setErrField('')
    //     }
    // }, [expiryDate])

    useEffect(() => {
        if (useDefaultPostal) {
            setValue('postalCode', defaultPostalCode)
        } else {
            setValue('postalCode', '')
        }
    }, [useDefaultPostal])

    const formattedDate = moment(new Date('2030-01-01'), 'YYYY-MM-DD HH:mm')

    const submitPost = async (data: object) => {
        const imageURL = await handleImageUpload(base64Images)
        const res = await createPost({
            postData: {
                title: data['title'],
                images: imageURL,
                postedBy: user['user_id'],
                description: desc,
                logistics: logistics.sort(),
                postalCode: data['postalCode'],
                accessNeeds: accessNeeds,
                categories: categories.sort(),
                diet: diet.sort(),
                // expiryDate: expiryDate
                expiryDate: formattedDate
            },
            postType: 'o'
        })

        if (res.msg === "success") {
            alert!({ type: 'open', message: 'Offer posted successfully!', alertType: 'success' })
            navigation.navigate('HomeScreen')
        } else if (res.msg === "failure") {
            alert!({ type: 'open', message: 'An error occured!', alertType: 'error' })
        } else {
            if (res.msg === 'Please enter a valid postal code') {
                setError('postalCode', {
                    type: "server",
                    message: res.msg
                })
            } else {
                alert!({ type: 'open', message: res.msg ? res.msg : 'An error occured!', alertType: 'error' })
            }
        }
    }

    const handlePress = async (data: object) => {
        if (!user || !user['user_id']) {
            alert!({ type: 'open', message: 'You are not logged in!', alertType: 'error' })
            navigation.navigate('LoginScreen')
            return
        } else if (loading) {
            return
        }

        if (categories.length === 0) {
            setErrField('categories')
            scrollTo('categories')
            return
        } 
        // else if (!expiryDate) {
        //     setErrField('expiryDate')
        //     scrollTo('expiryDate')
        //     return
        // }

        setLoading(true)
        try {
            await submitPost(data)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            alert!({ type: 'open', message: 'An error occured!', alertType: 'error' })
        }
    }

    return (
        <View style={{ height: '100%', backgroundColor: Colors.Background }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                testID="Offer.formContainer"
                style={styles.formContainer}
                ref={scrollView}
            >
                <View>
                    <Text
                        testID="Offer.titleLabel"
                        style={[styles.formTitleText, { color: errors.title ? Colors.alert2 : Colors.dark }]}
                    >Title <Text style={{ color: Colors.alert2 }}>*</Text>
                    </Text>
                    <Text
                        testID="Offer.titleDesc"
                        style={styles.formDescText}
                    >Create a descriptive title for your offering.</Text>
                </View>
                <View
                    testID="Offer.formInputContainer"
                    style={styles.formInputContainer}
                    onLayout={() => {
                        dataSourceCords['title'] = 0;
                        setDataSourceCords(dataSourceCords);
                    }}
                >
                    <Controller
                        defaultValue=""
                        control={control}
                        rules={{
                            required: "Please enter a title to your request",
                            maxLength: {
                                value: 100,
                                message: "Title should be at most 100 characters"
                            }
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                value={value}
                                nativeID="title"
                                testID="Offer.titleInput"
                                placeholder=""
                                placeholderTextColor="#656565"
                                style={[styles.formInput, { borderColor: errors.title ? Colors.alert2 : Colors.midLight }]}
                                onChangeText={onChange}
                                onChange={onChange}
                                maxLength={100}
                                onBlur={onBlur}
                            />
                        )}
                        name="title"
                    />
                </View>
                {errors.title &&
                    <Text testID="Request.titleErrMsg" style={styles.formErrorMsg}>{errors.title.message}</Text>}
                <View>
                    <Text testID="Offer.photoLabel" style={styles.formTitleText}>Photo</Text>
                    <Text
                        testID="Offer.photoDesc"
                        style={styles.formDescText}
                    >Add photo(s) to help community members understand what you are offering.</Text>
                </View>
                <ImagePicker imagesURIs={imagesURIs} base64Images={base64Images} setImagesURIs={setImagesURIs} setBase64Images={setBase64Images} />
                <View
                    onLayout={(event) => {
                        const layout = event.nativeEvent.layout;
                        dataSourceCords['categories'] = layout.y;
                        setDataSourceCords(dataSourceCords);
                    }}
                >
                    <Text
                        testID="Request.categoryLabel"
                        style={[styles.formTitleText, { color: errField === 'categories' ? Colors.alert2 : Colors.dark }]}
                    >Category<Text style={{ color: Colors.alert2 }}>*</Text></Text>
                    <Text
                        testID="Request.categoryDesc"
                        style={styles.formDescText}
                    >Please select all the food categories that apply.</Text>
                    <FoodFilters
                        state={categories}
                        setState={setCategories}
                        foodType={FOODCATEGORIES}
                        getType={getCategory}
                        name={'categories'}
                    />
                </View>
                {/* <View>
                    <Text
                        testID="Request.categoryLabel"
                        style={styles.formTitleText}
                    >Dietary preferences</Text>
                    <Text
                        testID="Request.categoryDesc"
                        style={styles.formDescText}
                    >Please indicate any dietary preferences or allergies that apply to the food you are offering.</Text>
                    <FoodFilters
                        state={diet}
                        setState={setDiet}
                        foodType={DIETPREFERENCES}
                        getType={getDiet}
                        name={'diet'}
                    />
                </View> */}
                {/* <View style={{ opacity: 0.5 }}>
                        <Text testID="Offer.quantityLabel" style={styles.formTitleText}>Quantity <Text style={{ color: Colors.alert2 }}>*</Text></Text>
                        <Text testID="Offer.quantityDesc" style={styles.formDescText}>Please input the quantity of the food you are offering.</Text>
                        <Quantity />
                    </View> */}
                {/* <View
                    onLayout={(event) => {
                        const layout = event.nativeEvent.layout;
                        dataSourceCords['expiryDate'] = layout.y;
                        setDataSourceCords(dataSourceCords);
                    }}
                >
                    <Text
                        testID="Request.dateLabel"
                        style={[styles.formTitleText, { color: errField === 'expiryDate' ? Colors.alert2 : Colors.dark }]}
                    >Expiry Date <Text style={{ color: Colors.alert2 }}>*</Text></Text>
                    <Text
                        testID="Request.dateDesc"
                        style={styles.formDescText}
                    >Please select an expiry date for the post or the food you are offering.
                        <Text
                            style={{ fontFamily: Fonts.PublicSans_SemiBold, fontWeight: '600', color: '#646464' }}
                        > Your post will expire at the end of this date.</Text>
                    </Text>
                    <DatePicker setNeedBy={setExpiryDate} errField={errField} />
                </View> */}
                <View
                    onLayout={(event) => {
                        const layout = event.nativeEvent.layout;
                        dataSourceCords['postalCode'] = layout.y;
                        setDataSourceCords(dataSourceCords);
                    }}
                >
                    <Text
                        testID="Request.dateLabel"
                        style={[styles.formTitleText, { color: errors.postalCode ? Colors.alert2 : Colors.dark }]}
                    >Pick up or delivery location <Text style={{ color: Colors.alert2 }}>*</Text></Text>
                    <Text
                        testID="Request.dateDesc"
                        style={styles.formDescText}
                    >Please indicate the postal code of your desired pick up or delivery location. No one else will see your postal code.</Text>
                    <View style={styles.choiceContainer}>
                        <MaterialCommunityIcons
                            name={useDefaultPostal ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={22}
                            onPress={() => {
                                clearErrors('postalCode')
                                setUseDefaultPostal(!useDefaultPostal)
                            }}
                            style={styles.icon}
                        />
                        <Text style={globalStyles.Body}>Use my default postal code</Text>
                    </View>
                    {!useDefaultPostal &&
                        <View
                            testID="Request.formInputContainer"
                            style={[styles.formInputContainer, { marginBottom: 20 }]}
                        >
                            <Controller
                                defaultValue=""
                                control={control}
                                rules={{
                                    required: "Please enter a postal code to your offering",
                                    pattern: {
                                        value: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
                                        message: "Please enter a valid postal code"
                                    }
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        value={value}
                                        nativeID="postalCode"
                                        testID="Request.postalCodeInput"
                                        placeholder="XXX XXX"
                                        placeholderTextColor="#656565"
                                        style={[styles.formInput,
                                        { borderColor: errors.postalCode ? Colors.alert2 : Colors.midLight }]}
                                        onChangeText={onChange}
                                        onChange={onChange}
                                        maxLength={7}
                                        onBlur={onBlur}
                                    />
                                )}
                                name="postalCode"
                            />
                        </View>
                    }
                </View>
                {errors.postalCode &&
                    <Text testID="Request.titleErrMsg" style={styles.formErrorMsg}>{errors.postalCode.message}</Text>}
                <View style={{ marginBottom: 10 }}>
                    <Text
                        testID="Request.dateLabel"
                        style={styles.formTitleText}
                    >Pick up or delivery preferences</Text>
                    <Text testID="Request.dateDesc" style={styles.formDescText}>Select all that apply.</Text>
                    <Logistics logistics={logistics} setLogistics={setLogistics} />
                </View>
                <View>
                    <Text testID="Offer.descTitle" style={styles.formTitleText}>Access needs for pick up or delivery</Text>
                    <Text testID="Offer.descDesc" style={styles.formDescText}>Please indicate if you have any access needs for sharing the food you are offering.</Text>
                </View>
                <View style={styles.formDescInputView}>
                    <TextInput
                        value={accessNeeds}
                        nativeID="desc"
                        testID="Offer.descInput"
                        placeholder="Enter access needs"
                        placeholderTextColor="#656565"
                        style={styles.formInputText}
                        multiline={true}
                        onChangeText={setAccessNeeds}
                        maxLength={128}
                    />
                </View>
                {/* <View
                onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    dataSourceCords['accessNeeds'] = layout.y;
                    setDataSourceCords(dataSourceCords);
                }}
            >
                <Text
                    testID="Request.dateLabel"
                    style={[styles.formTitleText, { color: errField === 'accessNeeds' ? Colors.alert2 : Colors.dark }]}
                >Access needs for pick up or delivery <Text style={{ color: Colors.alert2 }}>*</Text></Text>
                <Text
                    testID="Request.dateDesc"
                    style={styles.formDescText}
                >Please indicate if you have any access needs for sharing the food you are offering.</Text>
                <AccessNeeds accessNeeds={accessNeeds} setAccessNeeds={setAccessNeeds} postType={"o"} />
            </View> */}
                <View>
                    <Text testID="Offer.descTitle" style={styles.formTitleText}>{("Description")}</Text>
                    <Text testID="Offer.descDesc" style={styles.formDescText}>Describe your food offer in detail</Text>
                </View>
                <View style={styles.formDescInputView}>
                    <TextInput
                        value={desc}
                        nativeID="desc"
                        testID="Offer.descInput"
                        placeholder="Enter Description"
                        placeholderTextColor="#656565"
                        style={styles.formInputText}
                        multiline={true}
                        onChangeText={setDesc}
                        maxLength={1024}
                    />
                </View>
            </ScrollView >
        </View>
    )
}

export default OfferFormScreen