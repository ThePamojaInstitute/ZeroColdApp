import { act, fireEvent, render } from "@testing-library/react-native"
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Utils from "../../src/controllers/post";
import { axiosInstance } from "../../config";
import { AuthContext } from "../../src/context/AuthContext"
import { AlertContext, AlertContextFields, AlertContextType } from "../../src/context/Alert"
import { mock } from "jest-mock-extended";
import MockAdapter from "axios-mock-adapter";
import { OfferFormScreen } from "../../src/screens/OfferFormScreen";


const mockAxios = new MockAdapter(axiosInstance)
const mockAlert = mock<AlertContextFields>()
const mockAlertDispatch: React.Dispatch<any> = jest.fn()
const mockAlertValue: AlertContextType = {
    alert: mockAlert,
    dispatch: mockAlertDispatch
}
const mockEvent = { preventDefault: jest.fn() };
const mockUser = { username: 'test', user_id: '1' }

const spyCreatePost = jest.spyOn(Utils, 'createPost')

afterEach(() => {
    jest.clearAllMocks();
})

const AuthContextValues = { user: "", accessToken: "", refreshToken: "", loading: false, error: "", dispatch: null }
const imageUrl = "https://images.pexels.com/photos/1118332/pexels-photo-1118332.jpeg?auto=compress&cs=tinysrgb&w=600"

const TestComponent = () => {
    const Stack = createNativeStackNavigator();

    return (
        <NavigationContainer>
            <AlertContext.Provider value={mockAlertValue}>
                <Stack.Navigator>
                    <Stack.Screen
                        name="OfferFormScreen"
                        component={OfferFormScreen}
                    />
                </Stack.Navigator>
            </AlertContext.Provider>
        </NavigationContainer>
    )
}

describe('onload', () => {
    it('renders default elements', () => {
        const { getAllByText, getAllByTestId } = render(
            <AuthContext.Provider value={AuthContextValues}>
                <TestComponent />
            </AuthContext.Provider >
        )

        expect(getAllByTestId('offerTitle').length).toBe(1)
        expect(getAllByText('Create a descriptive title for the food you are offering').length).toBe(1)
        expect(getAllByTestId('offerTitleInput').length).toBe(1)
        expect(getAllByText('Photo').length).toBe(1)
        expect(getAllByText('Optional: Add photo(s) to help community members understand what you are sharing').length).toBe(1)
        expect(getAllByTestId('AccessCameraRoll.Button').length).toBe(1)
        expect(getAllByText('No Images').length).toBe(1)
        expect(getAllByText('Description').length).toBe(1)
        expect(getAllByText('Optional: Describe your offer in detail').length).toBe(1)
        expect(getAllByTestId('offerDescInput').length).toBe(1)
    })
})

describe('on post submit', () => {
    it('renders post button', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={AuthContextValues}>
                <TestComponent />
            </AuthContext.Provider >
        )

        getByTestId('createPost.Button')
    })

    it('shows alert if user is not logged in', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={AuthContextValues}>
                <TestComponent />
            </AuthContext.Provider >
        )

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).toBeCalledTimes(1)
        expect(mockAlertDispatch).toBeCalledWith({
            "alertType": "error",
            "message": "You are not logged in!",
            "type": "open"
        })
    })

    it('shows alert when no title inputed', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).toBeCalledTimes(1)
        expect(mockAlertDispatch).toBeCalledWith({
            "alertType": "error",
            "message": "Please enter a title to your offer",
            "type": "open"
        })
    })

    it('shows alert when title has more than 100 characters', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        const titleInput = getByTestId("offerTitleInput")

        fireEvent.changeText(titleInput,
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean ma'
        )

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).toBeCalledTimes(1)
        expect(mockAlertDispatch).toBeCalledWith({
            "alertType": "error",
            "message": "Title should be at most 100 characters",
            "type": "open"
        })
    })

    it('shows alert when no description inputed', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        const titleInput = getByTestId("offerTitleInput")

        fireEvent.changeText(titleInput, 'test title')

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).toBeCalledTimes(1)
        expect(mockAlertDispatch).toBeCalledWith({
            "alertType": "error",
            "message": "Please enter a description to your offer",
            "type": "open"
        })
    })

    it('shows no alert when title and description are inputed', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        const titleInput = getByTestId("offerTitleInput")
        const descInput = getByTestId("offerDescInput")

        fireEvent.changeText(titleInput, 'test title')
        fireEvent.changeText(descInput, 'test desc')

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).not.toBeCalledWith({
            "alertType": "error",
            "message": "Please enter a title to your offer",
            "type": "open"
        })
        expect(mockAlertDispatch).not.toBeCalledWith({
            "alertType": "error",
            "message": "Title should be at most 100 characters",
            "type": "open"
        })
        expect(mockAlertDispatch).not.toBeCalledWith({
            "alertType": "error",
            "message": "Please enter a description to your offer",
            "type": "open"
        })
    })
})

describe('createPost', () => {
    it('calls createPost when all required inputs are inputed', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        const titleInput = getByTestId("offerTitleInput")
        const descInput = getByTestId("offerDescInput")

        fireEvent.changeText(titleInput, 'test title')
        fireEvent.changeText(descInput, 'test desc')

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(spyCreatePost).toBeCalledTimes(1)
        expect(spyCreatePost).toBeCalledWith({
            "description": "test desc",
            "images": imageUrl,
            "postType": "o",
            "postedBy": "1",
            "postedOn": Math.floor(new Date().getTime() / 1000) || Math.floor(new Date().getTime() / 1000) + 1,
            "title": "test title"
        })
    })

    it('return failure message when request fails', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        mockAxios.onPost('/posts/createPost').reply(500)

        const titleInput = getByTestId("offerTitleInput")
        const descInput = getByTestId("offerDescInput")

        fireEvent.changeText(titleInput, 'test title')
        fireEvent.changeText(descInput, 'test desc')

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).toBeCalledTimes(1)
        expect(mockAlertDispatch).toBeCalledWith({
            type: 'open',
            message: 'An error occured!',
            alertType: 'error'
        })
    })

    it('return success message when request succeeds', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={{ ...AuthContextValues, user: mockUser }}>
                <TestComponent />
            </AuthContext.Provider >
        )

        mockAxios.onPost('/posts/createPost').reply(201)

        const titleInput = getByTestId("offerTitleInput")
        const descInput = getByTestId("offerDescInput")

        fireEvent.changeText(titleInput, 'test title')
        fireEvent.changeText(descInput, 'test desc')

        await act(() => {
            fireEvent.press(getByTestId("createPost.Button"), mockEvent)
        })

        expect(mockAlertDispatch).toBeCalledTimes(1)
        expect(mockAlertDispatch).toBeCalledWith({
            type: 'open',
            message: 'Request posted successfully!',
            alertType: 'success'
        })
    })
})