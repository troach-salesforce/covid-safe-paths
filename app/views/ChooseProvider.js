import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  BackHandler,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import Yaml from 'js-yaml';
import RNFetchBlob from 'rn-fetch-blob';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  renderers,
  withMenuContext,
} from 'react-native-popup-menu';
import { GetStoreData, SetStoreData } from '../helpers/General';
import Colors from '../constants/colors';
import fontFamily from '../constants/fonts';
import closeIcon from '../assets/images/closeIcon.png';
import saveIcon from '../assets/images/saveIcon.png';
import languages from '../locales/languages';
import NavigationBarWrapper from '../components/NavigationBarWrapper';

const { SlideInMenu } = renderers;

const authoritiesListURL =
  'https://raw.githubusercontent.com/tripleblindmarket/safe-places/develop/healthcare-authorities.yaml';

class ChooseProviderScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAuthorities: [],
      displayUrlEntry: 'none',
      urlEntryInProgress: false,
      urlText: '',
      authoritiesList: [],
    };
  }

  backToMain() {
    this.props.navigation.goBack();
  }

  handleBackPress = () => {
    this.props.navigation.goBack();
    return true;
  };

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    this.fetchAuthoritiesList();

    // Update user settings state from async storage
    GetStoreData('AUTHORITY_SOURCE_SETTINGS', false).then((result) => {
      if (result !== null) {
        console.log('Retrieving settings from async storage:');
        console.log(result);
        this.setState({
          selectedAuthorities: result,
        });
      } else {
        console.log('No stored authority settings.');
      }
    });
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  fetchAuthoritiesList() {
    try {
      RNFetchBlob.config({
        // add this option that makes response data to be stored as a file,
        // this is much more performant.
        fileCache: true,
      })
        .fetch('GET', authoritiesListURL, {
          // some headers ..
        })
        .then((result) => {
          RNFetchBlob.fs.readFile(result.path(), 'utf8').then((list) => {
            // If unable to load the file, change state to display error in appropriate menu
            const parsedFile = Yaml.safeLoad(list).Authorities;
            if (parsedFile !== undefined) {
              this.setState({
                authoritiesList: parsedFile,
              });
            } else {
              this.setState({
                authoritiesList: [
                  {
                    'Unable to load authorities list': [{ url: 'No URL' }],
                  },
                ],
              });
            }
          });
        });
    } catch (error) {
      console.log(error);
    }
  }

  // Add selected authorities to state, for display in the FlatList
  addAuthorityToState(prevState, authority) {
    const authorityIndex = prevState.authoritiesList.findIndex(
      (x) => Object.keys(x)[0] === authority,
    );

    if (this.state.selectedAuthorities.findIndex((x) => x.key === authority) === -1) {
      this.setState(
        {
          selectedAuthorities: prevState.selectedAuthorities.concat({
            key: authority,
            url: prevState.authoritiesList[authorityIndex][authority][0].url,
          }),
        },
        () => {
          // Add current settings state to async storage.
          SetStoreData('AUTHORITY_SOURCE_SETTINGS', this.state.selectedAuthorities);
        },
      );
    } else {
      console.log('Not adding the duplicate to sources list');
    }
  }

  addCustomUrlToState(prevState) {
    const urlInput = prevState.urlText;
    if (urlInput === '') {
      console.log('URL input was empty, not saving');
    } else if (prevState.selectedAuthorities.findIndex((x) => x.url === urlInput) !== -1) {
      console.log('URL input was duplicate, not saving');
    } else {
      this.setState(
        {
          selectedAuthorities: prevState.selectedAuthorities.concat({
            key: urlInput,
            url: urlInput,
          }),
          displayUrlEntry: 'none',
          urlEntryInProgress: false,
        },
        () => {
          // Add current settings state to async storage.
          SetStoreData('AUTHORITY_SOURCE_SETTINGS', prevState.selectedAuthorities);
        },
      );
    }
  }

  removeAuthorityFromState(prevState, authority) {
    Alert.alert(
      languages.t('label.authorities_removal_alert_title'),
      languages.t('label.authorities_removal_alert_desc'),
      [
        {
          text: languages.t('label.authorities_removal_alert_cancel'),
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: languages.t('label.authorities_removal_alert_proceed'),
          onPress: () => {
            const removalIndex = this.state.selectedAuthorities.indexOf(authority);
            this.state.selectedAuthorities.splice(removalIndex, 1);

            this.setState(
              {
                selectedAuthorities: prevState.selectedAuthorities,
              },
              () => {
                // Add current settings state to async storage.
                SetStoreData('AUTHORITY_SOURCE_SETTINGS', this.state.selectedAuthorities);
              },
            );
          },
        },
      ],
      { cancelable: false },
    );
  }

  render() {
    return (
      <NavigationBarWrapper
        title={languages.t('label.choose_provider_title')}
        onBackPress={this.backToMain.bind(this)}>
        <View style={styles.main}>
          <Text style={styles.headerTitle}>{languages.t('label.authorities_title')}</Text>
          <Text style={styles.sectionDescription}>{languages.t('label.authorities_desc')}</Text>
        </View>

        <View style={styles.listContainer}>
          {Object.keys(this.state.selectedAuthorities).length === 0 ? (
            <>
              <Text
                style={
                  (styles.sectionDescription,
                  {
                    textAlign: 'center',
                    fontSize: 24,
                    paddingTop: 30,
                    color: '#dd0000',
                  })
                }>
                {languages.t('label.authorities_no_sources')}
              </Text>
              <View style={[styles.flatlistRowView, { display: this.state.displayUrlEntry }]}>
                <TextInput
                  onChangeText={(text) => {
                    this.setState({
                      urlText: text,
                    });
                  }}
                  value={this.state.urlText}
                  autoFocus={this.state.urlEntryInProgress}
                  style={[styles.item, styles.textInput]}
                  placeholder={languages.t('label.authorities_input_placeholder')}
                  onSubmitEditing={() => this.addCustomUrlToState(this.state)}
                />
                <TouchableOpacity onPress={() => this.addCustomUrlToState(this.state)}>
                  <Image source={saveIcon} style={styles.saveIcon} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.flatlistRowView, { display: this.state.displayUrlEntry }]}>
                <TextInput
                  onChangeText={(text) => {
                    this.setState({
                      urlText: text,
                    });
                  }}
                  value={this.state.urlText}
                  autoFocus={this.state.urlEntryInProgress}
                  style={[styles.item, styles.textInput]}
                  placeholder='Paste your URL here'
                  onSubmitEditing={() => this.addCustomUrlToState(this.state)}
                />
                <TouchableOpacity onPress={() => this.addCustomUrlToState(this.state)}>
                  <Image source={saveIcon} style={styles.saveIcon} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={this.state.selectedAuthorities}
                renderItem={({ item }) => (
                  <View style={styles.flatlistRowView}>
                    <Text style={styles.item}>{item.key}</Text>
                    <TouchableOpacity
                      onPress={() => this.removeAuthorityFromState(this.state, item)}>
                      <Image source={closeIcon} style={styles.closeIcon} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}
        </View>

        <Menu
          name='AuthoritiesMenu'
          renderer={SlideInMenu}
          style={{ flex: 1, justifyContent: 'center' }}>
          <MenuTrigger>
            <TouchableOpacity
              style={styles.startLoggingButtonTouchable}
              onPress={() => this.props.ctx.menuActions.openMenu('AuthoritiesMenu')}
              disabled={this.state.urlEditInProgress}>
              <Text style={styles.startLoggingButtonText}>
                {languages.t('label.authorities_add_button_label')}
              </Text>
            </TouchableOpacity>
          </MenuTrigger>
          <MenuOptions>
            {this.state.authoritiesList === undefined
              ? null
              : this.state.authoritiesList.map((item) => {
                  const name = Object.keys(item)[0];
                  const key = this.state.authoritiesList.indexOf(item);

                  return (
                    <MenuOption
                      key={key}
                      onSelect={() => {
                        this.addAuthorityToState(this.state, name);
                      }}
                      disabled={this.state.authoritiesList.length === 1}>
                      <Text style={styles.menuOptionText}>{name}</Text>
                    </MenuOption>
                  );
                })}
            <MenuOption
              onSelect={() => {
                this.setState({
                  displayUrlEntry: 'flex',
                  urlEntryInProgress: true,
                });
              }}>
              <Text style={styles.menuOptionText}>{languages.t('label.authorities_add_url')}</Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </NavigationBarWrapper>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 2,
    flexDirection: 'column',
    textAlignVertical: 'top',
    // alignItems: 'center',
    padding: 20,
    width: '96%',
    alignSelf: 'center',
  },
  listContainer: {
    flex: 3,
    flexDirection: 'column',
    textAlignVertical: 'top',
    justifyContent: 'flex-start',
    padding: 20,
    width: '96%',
    alignSelf: 'center',
    backgroundColor: Colors.WHITE,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.primaryBold,
    color: Colors.VIOLET_TEXT,
  },
  sectionDescription: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: 12,
    overflow: 'scroll',
    color: Colors.VIOLET_TEXT,
    fontFamily: fontFamily.primaryRegular,
  },
  menuOptionText: {
    fontFamily: fontFamily.primaryRegular,
    fontSize: 14,
    padding: 10,
  },
  item: {
    fontFamily: fontFamily.primaryRegular,
    fontSize: 16,
    padding: 10,
    maxWidth: '90%',
  },
  closeIcon: {
    width: 15,
    height: 15,
    opacity: 0.5,
    marginTop: 14,
  },
  saveIcon: {
    width: 17,
    height: 17,
    opacity: 0.5,
    marginTop: 14,
  },
  textInput: {
    marginLeft: 10,
  },
});

export default withMenuContext(ChooseProviderScreen);
